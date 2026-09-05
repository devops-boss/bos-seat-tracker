// Seat Tracker API
//
// This is intentionally tiny: the frontend already keeps its entire world
// (dbState + opsAccounts) as one JSON object. Instead of reinventing a schema,
// this service just persists that same object server-side, so every browser
// that loads the app reads and writes the SAME copy — instead of each browser
// having its own private localStorage copy.
//
// No manual setup needed after `docker compose up`: the SQLite file and table
// are created automatically on first boot.

const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'seat-tracker.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

// Return the whole saved state (or an empty shell if nothing has been saved yet).
app.get('/api/state', (req, res) => {
  const row = db.prepare('SELECT data FROM app_state WHERE id = 1').get();
  if (!row) return res.json({ dbState: {}, opsAccounts: {}, accountSchedules: {} });
  try {
    res.json(JSON.parse(row.data));
  } catch (e) {
    res.status(500).json({ error: 'Stored state is corrupted.' });
  }
});

// Overwrite the whole saved state. The frontend always sends the full
// object (same as it used to write the full object to localStorage). We
// persist the whole request body as-is (not just a fixed set of keys) so
// that new top-level fields the frontend adds later (e.g. accountSchedules)
// round-trip correctly without needing a matching server change.
app.post('/api/state', (req, res) => {
  const body = req.body || {};
  if (!body.dbState || typeof body.dbState !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid dbState.' });
  }
  const payload = JSON.stringify(body);
  db.prepare(`
    INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(payload);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Seat tracker API listening on port ' + PORT + ', data dir: ' + DATA_DIR);
});
