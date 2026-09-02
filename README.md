# OPS Room Seat Tracker

Client-side seat tracker for the OPS rooms (OPS 1/3/5/7/8), backed by a tiny
SQLite-powered API so everyone hits the same shared seat plan instead of each
browser keeping its own private copy. The Excel export still runs entirely
client-side via ExcelJS.

## Files

```
index.html               Page shell — loads styles.css and script.js
styles.css                All styling
script.js                 App logic (seat layouts, drag/drop, save/load, Excel export)
Dockerfile                Builds a small nginx image that serves the 3 files above
deploy/nginx.conf         Nginx site config (gzip, cache headers, /api proxy, /healthz)
server/                   Tiny Express + SQLite API that stores the shared app state
docker-compose.yml        Base service definitions (seat-tracker + api, no port published)
docker-compose.local.yml  Overlay: publish port 8080 on the host for a quick test
docker-compose.pangolin.yml  Overlay: add the Pangolin "Newt" sidecar
.env.example              Template for Pangolin/Newt credentials
```

`docker compose up` builds and runs both containers together — nothing else
to install or configure. The SQLite database file lives in a Docker volume
(`seat-tracker-data`), so it survives restarts and redeploys automatically.

## Option A — Run it directly with Docker (no Pangolin)

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Then open `http://<server-ip>:8080`. Put this behind whatever reverse proxy /
TLS termination your server already uses (nginx, Traefik, IIS ARR, etc.) if
you want it on a real hostname with HTTPS.

To stop it: `docker compose -f docker-compose.yml -f docker-compose.local.yml down`

## Option B — Expose it through Pangolin

This assumes you already have a Pangolin server running somewhere (cloud or
self-hosted) and just need to plug this app in as a new resource.

1. **Create a Site in Pangolin.** In the Pangolin dashboard: `Sites -> Create
   Site`, type **Docker/Newt**. This gives you a `Newt ID` and `Newt Secret`.

2. **Set up credentials on the company server:**
   ```bash
   cp .env.example .env
   # edit .env and fill in PANGOLIN_ENDPOINT, NEWT_ID, NEWT_SECRET
   ```

3. **Start the app + Newt connector together:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.pangolin.yml up -d --build
   ```
   This does *not* publish any port to the host — Newt reaches the
   `seat-tracker` container directly over the internal Docker network, and
   tunnels out to your Pangolin server. Nothing needs to be opened on the
   server's firewall for this.

4. **Confirm the Site shows "Online"** in the Pangolin dashboard once `newt`
   has connected.

5. **Create a Resource** on that Site pointing at:
   - Target: `seat-tracker`
   - Port: `80`
   - Protocol: HTTP

   Pangolin will handle TLS/routing for whatever public hostname you assign
   to the resource (e.g. `seat-tracker.yourcompany.com`), plus any
   identity-aware access rules (SSO/2FA, allowed users) you want to attach.

6. Add access policy / allowed users on the Resource in Pangolin as needed,
   then share the resulting URL with the team.

### Updating later

```bash
git pull   # or copy over new index.html/styles.css/script.js
docker compose -f docker-compose.yml -f docker-compose.pangolin.yml up -d --build
```

## Notes on the app itself

- **Data now lives server-side**, in a SQLite file inside the `api`
  container's `/app/data` volume — every browser that opens the page reads
  and writes the same seat plan. `localStorage` is still written to as a
  same-browser fallback, so nothing breaks mid-session if the API is briefly
  unreachable, but the API is the real source of truth. There's no schema to
  manage or migrate — the app still saves/loads one JSON object, it's just
  stored on the server now instead of in the browser.
- Two people saving changes at the exact same moment is a last-write-wins
  situation (whoever's save request lands last on the server wins) — there's
  no conflict/merge handling. Fine for occasional edits; worth keeping in
  mind if several people might commit a seat plan within seconds of each
  other.
- To back up the data, copy the SQLite file out of the named volume (e.g.
  `docker cp seat-tracker-api:/app/data/seat-tracker.db ./backup.db`).
- The Excel export button relies on the ExcelJS CDN script tag in
  `index.html`; if the company server has no outbound internet access, host
  a local copy of `exceljs.min.js` and update that `<script src="...">` tag.
- `/healthz` on the nginx container returns `200 ok` — useful for uptime
  monitors or Pangolin health checks.
- The header logo expects a file named `BOS_logo.png` next to `index.html`
  (not included in this package). It's shown at 44×44px on a white rounded
  square (`object-fit: contain`, so the full image is always visible without
  cropping, whatever its native aspect ratio). If it's missing or fails to
  load, a plain "B" badge is shown instead. Drop your PNG in alongside
  `index.html` on the server to replace the fallback.
- Switching OPS tabs, switching sites, committing/discarding a plan, and
  entering/exiting a version-history preview use a brief (~110ms) crossfade
  instead of an instant content swap. Individual seat edits stay instant so
  clicking around still feels snappy.
- **Fixed:** OPS tab counts used to show wrong numbers for every tab except
  the currently selected one (e.g. switching to OPS 3 would make the OPS 1
  tab show an incorrect count) because the counter was always measuring
  against the *currently open* room's seat list instead of each tab's own.
  This also silently affected the Excel export header stats for every sheet
  except whichever OPS was open at export time — both are now fixed.
- The **legend** (Occupied/Training/Reserved/Vacant/New Hire) now sits below
  the floor plan instead of above it, and uses solid-color dots instead of
  the pale bordered boxes that looked like checkboxes.
- **Candelaria Seat Plan is now real**, mapped from `Candelaria_Seatplan.xlsx`
  — bay/row/seat-ID layout and door placement follow the source workbook
  exactly, and every occupied seat visible in that file is seeded in. A few
  notes on the mapping:
  - **OPS 5** used the `"OPS 5 Aug 28"` tab (the more recent of the two OPS 5
    sheets in the file) as the current snapshot.
  - **OPS 2's header said "14 active"** but no occupant names were actually
    filled in on that sheet — I went with what's visibly there (fully
    vacant, 17 seats) rather than guess at names. A couple of other sheets
    had similar 1–3 seat drift between their header count and the actual
    grid; I always used the actual filled-in cells as source of truth.
  - **Job titles weren't kept** (e.g. "Benefits Specialist") — this app only
    tracks occupant name + account, same as the HQ rooms, so only the
    person's name and company/account carried over.
  - **One seat ID typo was corrected**: OPS 4's sheet had `B214` where every
    other seat follows the `B2P#` pattern — mapped to `B2P14`.
  - **One team tag was ambiguous**: OPS 5's Richley Anne Sedeno was labeled
    `-HQ` in the sheet (unlike her row-mates, who were all `USLS`) — kept as
    team `"HQ"` verbatim; worth double-checking that's what was meant.
  - Gabriel Pontepedra (OPS 4) had no account listed in the sheet, so his
    seat has no team assigned — add one via the seat panel if needed.
- **HQ Seat Plan → OPS 10** is included as a standby placeholder (26 vacant
  seats, generic 2-bay template), positioned right after OPS 8 in the tab
  bar. Swap the `'OPS 10'` entry in `HQ_ROOM_LAYOUTS` in `script.js` for the
  real layout once it's sent — same pattern OPS 10 used to follow before
  Candelaria's real data arrived.
