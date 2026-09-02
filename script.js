const SITE_LIST = ['HQ Seat Plan', 'Candelaria Seat Plan'];
const DEFAULT_SITE = 'HQ Seat Plan';

const SITE_OPS_LISTS = {
  'HQ Seat Plan': ['OPS 1', 'OPS 3', 'OPS 5', 'OPS 6', 'OPS 7', 'OPS 8', 'OPS 10'],
  'Candelaria Seat Plan': ['OPS 1', 'OPS 2', 'OPS 3', 'OPS 4', 'OPS 5']
};

const STORAGE_PREFIX = 'ops-room-tracker-v8:';

const HQ_OPS_ACCOUNTS = {
  'OPS 1': ['Clearabee', 'Skanwear', 'Imagine Learning'],
  'OPS 3': ['Harper Group', 'Medex', 'Cipher Billing', 'Carrot Top', 'Essentials in Writing', 'DPAC', 'Cohley', 'Fat Pizza', 'Do Not Pay'],
  'OPS 5': ['Health Carousel'],
  'OPS 6': [],
  'OPS 7': ['Travers', 'USLS'],
  'OPS 8': ['UTD', 'Under the Doormat'],
  // Real floor plan is in now; no accounts assigned yet, so it starts fully vacant.
  'OPS 10': []
};

// Real Candelaria seat plan (mapped from Candelaria_Seatplan.xlsx). OPS 1/2/3
// carry no account/team info in the source sheet, so their dropdowns stay
// empty until assigned — use "+ Add Account" to add one.
const CANDELARIA_OPS_ACCOUNTS = {
  'OPS 1': [],
  'OPS 2': [],
  'OPS 3': [],
  'OPS 4': ['Cipher Billing'],
  'OPS 5': ['USLS', 'MyCali PT', 'Imagine Learning', 'HQ']
};

const SITE_OPS_ACCOUNTS = {
  'HQ Seat Plan': HQ_OPS_ACCOUNTS,
  'Candelaria Seat Plan': CANDELARIA_OPS_ACCOUNTS
};

let currentSite = DEFAULT_SITE;
let opsAccounts = SITE_OPS_ACCOUNTS[currentSite];

let notificationTimer = null;

function showWebDialog({ title, message, type = 'alert', placeholder = '', defaultValue = '', onConfirm }) {
  const overlay = document.getElementById('customDialogOverlay');
  const titleEl = document.getElementById('dialogTitle');
  const msgEl = document.getElementById('dialogMessage');
  const iconEl = document.getElementById('dialogIcon');
  const inputEl = document.getElementById('dialogInput');
  const actionsEl = document.getElementById('dialogActions');

  titleEl.textContent = title;
  msgEl.textContent = message;
  actionsEl.innerHTML = '';
  inputEl.value = defaultValue;
  inputEl.placeholder = placeholder;

  if (type === 'prompt') {
    inputEl.style.display = 'block';
    iconEl.textContent = '✏️';
  } else {
    inputEl.style.display = 'none';
    iconEl.textContent = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : '🔔');
  }

  if (type === 'confirm' || type === 'prompt') {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-dialog-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => closeWebDialog();

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-dialog-primary';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.onclick = () => {
      const val = inputEl.value;
      closeWebDialog();
      if (onConfirm) onConfirm(type === 'prompt' ? val : true);
    };

    actionsEl.appendChild(cancelBtn);
    actionsEl.appendChild(confirmBtn);
  } else {
    const okBtn = document.createElement('button');
    okBtn.className = 'btn-dialog-primary';
    okBtn.textContent = 'OK';
    okBtn.onclick = () => {
      closeWebDialog();
      if (onConfirm) onConfirm(true);
    };
    actionsEl.appendChild(okBtn);
  }

  overlay.classList.add('active-modal');
  if (type === 'prompt') {
    setTimeout(() => inputEl.focus(), 50);
  }
}

function closeWebDialog() {
  document.getElementById('customDialogOverlay').classList.remove('active-modal');
}

const HQ_ROOM_LAYOUTS = {
  'OPS 1': {
    mode: 'wide',
    blocks: [
      {
        rows: [
          { width: 11, ids: [36,37,38,39,40,41,42,43,44,45,46], prefix: 'BAY1P', maxCol: 12 },
          { width: 12, ids: [24,25,26,27,28,29,30,31,32,33,34,35], prefix: 'BAY1P', maxCol: 12 }
        ]
      },
      {
        rows: [
          { width: 11, ids: [13,14,15,16,17,18,19,20,21,22,23], prefix: 'BAY1P', maxCol: 12 },
          { width: 12, ids: [1,2,3,4,5,6,7,8,9,10,11,12], prefix: 'BAY1P', maxCol: 12 }
        ],
        showDoor: true // DOOR sits beside BAY1P12, the last seat on the floor
      }
    ]
  },
  'OPS 3': {
    mode: 'wide',
    blocks: [
      {
        bayName: 'BAY 4',
        rows: [
          { width: 7, ids: [15,14,13,12,11,10,9], prefix: 'BAY4P', maxCol: 8 },
          { width: 8, ids: [8,7,6,5,4,3,2,1], prefix: 'BAY4P', maxCol: 8 }
        ]
      },
      {
        bayName: 'BAY 3',
        rows: [
          { width: 7, ids: [15,14,13,12,11,10,9], prefix: 'BAY3P', maxCol: 8 },
          { width: 8, ids: [8,7,6,5,4,3,2,1], prefix: 'BAY3P', maxCol: 8 }
        ]
      },
      {
        bayName: 'BAY 2',
        rows: [
          { width: 7, ids: [15,14,13,12,11,10,9], prefix: 'BAY2P', maxCol: 8 },
          { width: 8, ids: [8,7,6,5,4,3,2,1], prefix: 'BAY2P', maxCol: 8 }
        ]
      },
      {
        bayName: 'BAY 1',
        rows: [
          { width: 7, ids: [15,14,13,12,11,10,9], prefix: 'BAY1P', maxCol: 8 },
          { width: 8, ids: [8,7,6,5,4,3,2,1], prefix: 'BAY1P', maxCol: 8 }
        ],
        showDoor: true
      }
    ]
  },
  'OPS 5': {
    mode: 'wide',
    blocks: [
      {
        bayName: 'BAY 4',
        split: true,
        left: { rows: [{ width: 4, ids: [67,68,69,70], prefix: 'BAY4P' }, { width: 4, ids: [58,59,60,61], prefix: 'BAY4P' }] },
        tlSeat: 'BAY4_TL',
        right: { rows: [{ width: 4, ids: [71,72,73,74], prefix: 'BAY4P' }, { width: 4, ids: [63,64,65,66], prefix: 'BAY4P' }] }
      },
      {
        bayName: 'BAY 3',
        split: true,
        left: { rows: [{ width: 4, ids: [49,50,51,52], prefix: 'BAY3P' }, { width: 4, ids: [39,40,41,42], prefix: 'BAY3P' }] },
        tlSeat: 'BAY3_TL',
        right: { rows: [{ width: 5, ids: [53,54,55,56,57], prefix: 'BAY3P' }, { width: 5, ids: [44,45,46,47,48], prefix: 'BAY3P' }] }
      },
      {
        bayName: 'BAY 2',
        split: true,
        left: { rows: [{ width: 4, ids: [30,31,32,33], prefix: 'BAY2P' }, { width: 4, ids: [20,21,22,23], prefix: 'BAY2P' }] },
        tlSeat: 'BAY2_TL',
        right: { rows: [{ width: 5, ids: [34,35,36,37,38], prefix: 'BAY2P' }, { width: 5, ids: [25,26,27,28,29], prefix: 'BAY2P' }] }
      },
      {
        bayName: 'BAY 1',
        split: true,
        left: { rows: [{ width: 4, ids: [11,12,13,14], prefix: 'BAY1P' }, { width: 4, ids: [1,2,3,4], prefix: 'BAY1P' }] },
        tlSeat: 'BAY1_TL',
        right: { rows: [{ width: 5, ids: [15,16,17,18,19], prefix: 'BAY1P' }, { width: 5, ids: [6,7,8,9,10], prefix: 'BAY1P' }] },
        showDoorCenter: true
      }
    ]
  },
  'OPS 6': {
    mode: 'compact',
    type: 'vertical',
    columns: [
      {
        bayName: 'BAY 1',
        pairs: [
          { left: 'BAY1P1', right: 'BAY1P13' }, { left: 'BAY1P2', right: 'BAY1P12' },
          { left: 'BAY1P3', right: 'BAY1P11' }, { left: 'BAY1P4', right: 'BAY1P10' },
          { left: 'BAY1P5', right: 'BAY1P9' }, { left: 'BAY1P6', right: 'BAY1P8' }
        ],
        leadSeat: 'BAY1P7', leadTitle: 'TL SEAT', showDoor: true
      },
      {
        bayName: 'BAY 2',
        pairs: [
          { left: 'BAY2P1', right: 'BAY2P13' }, { left: 'BAY2P2', right: 'BAY2P12' },
          { left: 'BAY2P3', right: 'BAY2P11' }, { left: 'BAY2P4', right: 'BAY2P10' },
          { left: 'BAY2P5', right: 'BAY2P9' }, { left: 'BAY2P6', right: 'BAY2P8' }
        ],
        leadSeat: 'BAY2P7', leadTitle: 'TL SEAT'
      },
      {
        bayName: 'BAY 3',
        pairs: [
          { left: 'BAY3P1' }, { left: 'BAY3P2' }, { left: 'BAY3P3' },
          { left: 'BAY3P4' }, { left: 'BAY3P5' }, { left: 'BAY3P6' }
        ]
      }
    ]
  },
  'OPS 7': {
    mode: 'compact',
    type: 'vertical',
    columns: [
      {
        bayName: 'BAY 1',
        pairs: [
          { left: 'Bay1P1', right: 'Bay1P13' }, { left: 'Bay1P2', right: 'Bay1P12' },
          { left: 'Bay1P3', right: 'Bay1P11' }, { left: 'Bay1P4', right: 'Bay1P10' },
          { left: 'Bay1P5', right: 'Bay1P9' }, { left: 'Bay1P6', right: 'Bay1P8' }
        ],
        leadSeat: 'Bay1P7', leadTitle: 'TL SEAT', showDoor: true
      },
      {
        bayName: 'BAY 2',
        pairs: [
          { left: 'Bay2P1', right: 'Bay2P13' }, { left: 'Bay2P2', right: 'Bay2P12' },
          { left: 'Bay2P3', right: 'Bay2P11' }, { left: 'Bay2P4', right: 'Bay2P10' },
          { left: 'Bay2P5', right: 'Bay2P9' }, { left: 'Bay2P6', right: 'Bay2P8' }
        ],
        leadSeat: 'Bay2P7', leadTitle: 'TL SEAT'
      }
    ]
  },
  'OPS 8': {
    mode: 'compact',
    type: 'vertical',
    columns: [
      {
        bayName: 'BAY 2',
        pairs: [
          { left: 'BAY2P10', right: 'BAY2P1' }, { left: 'BAY2P11', right: 'BAY2P2' },
          { left: 'BAY2P12', right: 'BAY2P3' }, { left: 'BAY2P4', right: 'BAY2P13' },
          { left: 'BAY2P9', right: 'BAY2P5' }, { left: 'BAY2P8', right: 'BAY2P6' }
        ],
        leadSeat: 'BAY2P7', leadTitle: 'TL SEAT'
      },
      {
        bayName: 'BAY 1',
        pairs: [
          { left: 'BAY1P10', right: 'BAY1P1' }, { left: 'BAY1P12', right: 'BAY1P2' },
          { left: 'BAY1P11', right: 'BAY1P3' }, { left: 'BAY1P8', right: 'BAY1P4' },
          { left: 'BAY1P9', right: 'BAY1P5' }, { left: 'BAY1P13', right: 'BAY1P6' }
        ],
        leadSeat: 'BAY1P7', leadTitle: 'TL SEAT', showDoor: true
      }
    ]
  },

  // Real OPS 10 floor plan — 4 bays side by side (BAY 4, BAY 3, BAY 2, BAY 1
  // left to right on the source floor sheet), each bay a 10-row x 2-seat
  // column: left column runs P1-P10 top to bottom, right column runs
  // P11-P20 top to bottom. DOOR sits beside BAY 1 (rightmost bay), matching
  // the source sheet. All seats start vacant (no seed occupants below).
  'OPS 10': {
    mode: 'compact',
    type: 'vertical',
    columns: [
      {
        bayName: 'BAY 4',
        pairs: [
          { left: 'BAY4P1', right: 'BAY4P11' },
          { left: 'BAY4P2', right: 'BAY4P12' },
          { left: 'BAY4P3', right: 'BAY4P13' },
          { left: 'BAY4P4', right: 'BAY4P14' },
          { left: 'BAY4P5', right: 'BAY4P15' },
          { left: 'BAY4P6', right: 'BAY4P16' },
          { left: 'BAY4P7', right: 'BAY4P17' },
          { left: 'BAY4P8', right: 'BAY4P18' },
          { left: 'BAY4P9', right: 'BAY4P19' },
          { left: 'BAY4P10', right: 'BAY4P20' }
        ]
      },
      {
        bayName: 'BAY 3',
        pairs: [
          { left: 'BAY3P1', right: 'BAY3P11' },
          { left: 'BAY3P2', right: 'BAY3P12' },
          { left: 'BAY3P3', right: 'BAY3P13' },
          { left: 'BAY3P4', right: 'BAY3P14' },
          { left: 'BAY3P5', right: 'BAY3P15' },
          { left: 'BAY3P6', right: 'BAY3P16' },
          { left: 'BAY3P7', right: 'BAY3P17' },
          { left: 'BAY3P8', right: 'BAY3P18' },
          { left: 'BAY3P9', right: 'BAY3P19' },
          { left: 'BAY3P10', right: 'BAY3P20' }
        ]
      },
      {
        bayName: 'BAY 2',
        pairs: [
          { left: 'BAY2P1', right: 'BAY2P11' },
          { left: 'BAY2P2', right: 'BAY2P12' },
          { left: 'BAY2P3', right: 'BAY2P13' },
          { left: 'BAY2P4', right: 'BAY2P14' },
          { left: 'BAY2P5', right: 'BAY2P15' },
          { left: 'BAY2P6', right: 'BAY2P16' },
          { left: 'BAY2P7', right: 'BAY2P17' },
          { left: 'BAY2P8', right: 'BAY2P18' },
          { left: 'BAY2P9', right: 'BAY2P19' },
          { left: 'BAY2P10', right: 'BAY2P20' }
        ]
      },
      {
        bayName: 'BAY 1',
        pairs: [
          { left: 'BAY1P1', right: 'BAY1P11' },
          { left: 'BAY1P2', right: 'BAY1P12' },
          { left: 'BAY1P3', right: 'BAY1P13' },
          { left: 'BAY1P4', right: 'BAY1P14' },
          { left: 'BAY1P5', right: 'BAY1P15' },
          { left: 'BAY1P6', right: 'BAY1P16' },
          { left: 'BAY1P7', right: 'BAY1P17' },
          { left: 'BAY1P8', right: 'BAY1P18' },
          { left: 'BAY1P9', right: 'BAY1P19' },
          { left: 'BAY1P10', right: 'BAY1P20' }
        ],
        showDoor: true
      }
    ]
  }
};

// --- Candelaria Seat Plan — mapped from Candelaria_Seatplan.xlsx ---
// Bay/row/seat-ID layout follows the source workbook's arrangement exactly.
// Occupant data reflects what was actually filled in on each sheet (not the
// sheet's own Total/Active header numbers, which didn't always match the
// visible cells — see the chat notes for specifics per room).
// Small helper to generate a run of consecutive seats along one grid row —
// keeps the layout tables below readable while staying fully declarative.
function seatRun(row, col, prefix, ids) {
  return ids.map((id, i) => ({ row, col: col + i, type: 'seat', id: prefix + id }));
}

// All five Candelaria rooms share one rendering engine (mode: 'grid') and one
// visual language (seat card, aisle strip, door box). Every position below
// was read directly, cell by cell, off the real Candelaria_Seatplan.xlsx —
// not reconstructed from a screenshot — so column offsets, aisle gaps, and
// door placement match the source sheet exactly.
const CANDELARIA_ROOM_LAYOUTS = {
  'OPS 1': {
    mode: 'grid',
    cols: 5,
    items: [
      ...seatRun(0, 0, 'B1P', [1, 2, 3, 4, 5]),
      { row: 1, col: 2, type: 'door' } // DOOR sits under B1P3 on the source sheet
    ]
  },
  'OPS 2': {
    mode: 'grid',
    cols: 7,
    colTemplate: '70px repeat(6, 1fr)',
    items: [
      // Col 0 = door margin, col 1 = the lone left column (B3P1/B2P6/B2P1
      // stack), col 2 = the aisle (unused/blank on the source sheet except
      // as a walking gap), cols 3-6 = the wider B2P7-10 / B2P2-5 cluster.
      { row: 0, col: 1, type: 'seat', id: 'B3P1' },
      { row: 0, col: 2, rowSpan: 3, type: 'gap' },
      ...seatRun(1, 1, 'B2P', [6]),
      ...seatRun(1, 3, 'B2P', [7, 8, 9, 10]),
      { row: 2, col: 0, type: 'door' },
      ...seatRun(2, 1, 'B2P', [1]),
      ...seatRun(2, 3, 'B2P', [2, 3, 4, 5]),
      // BAY 1 spans the full width, including the column that was the
      // aisle above it — the aisle only exists alongside BAY 2/BAY 3.
      ...seatRun(3, 1, 'B1P', [1, 2, 3, 4, 5, 6])
    ]
  },
  'OPS 3': {
    mode: 'grid',
    cols: 5,
    items: [
      ...seatRun(0, 0, 'B1P', [1, 2, 3, 4, 5]),
      { row: 1, col: 4, type: 'door' } // DOOR sits under B1P5 on the source sheet
    ]
  },
  'OPS 4': {
    mode: 'grid',
    cols: 11,
    colTemplate: '70px repeat(10, 1fr)',
    items: [
      ...seatRun(0, 1, 'B1P', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      // Door spans only the BAY 2 row it sits beside, not the whole floor.
      { row: 1, col: 0, type: 'door' },
      ...seatRun(1, 1, 'B2P', [1, 2, 3, 4, 5]),
      { row: 1, col: 6, colSpan: 2, type: 'gap' },
      ...seatRun(1, 8, 'B2P', [6, 7, 8]),
      ...seatRun(2, 3, 'B2P', [9, 10, 11]),
      { row: 2, col: 6, colSpan: 2, type: 'gap' },
      ...seatRun(2, 8, 'B2P', [12, 13, 14]),
      ...seatRun(3, 3, 'B3P', [1, 2, 3, 4, 5])
    ]
  },
  'OPS 5': {
    mode: 'grid',
    cols: 11,
    colTemplate: '90px repeat(9, 1fr) 70px',
    items: [
      ...seatRun(0, 1, 'BAY1P', [1, 2, 3, 4, 5, 6, 7, 8, 9]),
      // Full-width AISLE band between BAY 1 (row 0) and BAY 2 (row 2),
      // matching the source Candelaria_Seatplan.xlsx sheet exactly.
      { row: 1, col: 0, colSpan: 11, type: 'gap', horizontal: true },
      // BAY 3's three cubicles form their own column at col 0, lined up
      // row-by-row against BAY 2 — B3P3 has no BAY 2 row beside it, so
      // that row is genuinely empty on the right (no filler cells).
      { row: 2, col: 0, type: 'seat', id: 'B3P1' },
      ...seatRun(2, 1, 'BAY2P', [1, 2, 3, 4, 5, 6, 7, 8, 9]),
      { row: 2, col: 10, type: 'door' },
      { row: 3, col: 0, type: 'seat', id: 'B3P2' },
      ...seatRun(3, 1, 'BAY2P', [10, 11, 12, 13, 14, 15, 16, 17, 18]),
      { row: 4, col: 0, type: 'seat', id: 'B3P3' }
    ]
  }
};

// Seed occupants for the real Candelaria seat plan. Job titles from the
// source sheet (e.g. "Benefits Specialist") aren't stored — this app only
// tracks occupant name + account, same as HQ. Team Lead follows the same
// "TL <name>" + team:'Team Lead' convention used on the HQ sheets.
const CANDELARIA_OPS_DEFAULTS = {
  'OPS 1': {
    seats: {
      'B1P1': { occupant: 'Aija Andrade', team: '', status: 'occupied', isNewHire: false },
      'B1P2': { occupant: 'Janice De Guzman', team: '', status: 'occupied', isNewHire: false },
      'B1P5': { occupant: 'Grace Harina', team: '', status: 'occupied', isNewHire: false }
    }
  },
  'OPS 4': {
    seats: {
      'B1P1': { occupant: 'Nikki Martinez', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B1P3': { occupant: 'Kaila Binabaye', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B1P4': { occupant: 'Gabriel Pontepedra', team: '', status: 'occupied', isNewHire: false },
      'B1P5': { occupant: 'Rex Idea', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B1P6': { occupant: 'Darl Umali', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B1P7': { occupant: 'Ana Caraig', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B1P8': { occupant: 'Fria Umali', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B2P2': { occupant: 'Liane Dolores', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B2P3': { occupant: 'Rhomedyl Ador', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B2P4': { occupant: 'Raymond Dalisay', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B2P5': { occupant: 'Jamaica Lalongisip', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B2P6': { occupant: 'Jofath Genobe', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B2P11': { occupant: 'OS Carlo', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B3P1': { occupant: 'Luwayne Florante', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B3P2': { occupant: 'Geraldine De Guzman', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B3P3': { occupant: 'Christine Vergara', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B3P4': { occupant: 'Trisha Pagkaliwangan', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
      'B3P5': { occupant: 'Ma. Crismina Arcilla', team: 'Cipher Billing', status: 'occupied', isNewHire: false }
    }
  },
  'OPS 5': {
    seats: {
      'BAY1P7': { occupant: 'Carlyn Sandy Binabaye', team: 'MyCali PT', status: 'occupied', isNewHire: false },
      'BAY1P8': { occupant: 'Mark Tristan Javier', team: 'MyCali PT', status: 'occupied', isNewHire: false },
      'BAY1P9': { occupant: 'Danah Asilo', team: 'Imagine Learning', status: 'occupied', isNewHire: true },
      'BAY2P1': { occupant: 'Regidon Olivar', team: 'USLS', status: 'occupied', isNewHire: false },
      'BAY2P2': { occupant: 'Maria Lourdes Dimayuga', team: 'USLS', status: 'occupied', isNewHire: false },
      'BAY2P3': { occupant: 'Lily Alcantara', team: 'USLS', status: 'occupied', isNewHire: false },
      'BAY2P4': { occupant: 'Marvin Mance', team: 'USLS', status: 'occupied', isNewHire: false },
      'BAY2P5': { occupant: 'Richley Anne Sedeno', team: 'HQ', status: 'occupied', isNewHire: false }
    }
  }
};

const OPS1_SEATS = {
  'BAY1P36': { occupant: '', team: '', status: 'vacant', isNewHire: false },
  'BAY1P42': { occupant: 'Arman Buenaventura', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P44': { occupant: 'Janet Malabag', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P45': { occupant: 'Jann Angelo Reyes', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P46': { occupant: 'Rodgine Dechangco', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P24': { occupant: 'Carla Perilla', team: 'Imagine Learning', status: 'occupied', isNewHire: false },
  'BAY1P25': { occupant: 'Aldwick Reyes', team: 'Imagine Learning', status: 'occupied', isNewHire: false },
  'BAY1P26': { occupant: 'Jerome Calampiano', team: 'Imagine Learning', status: 'occupied', isNewHire: false },
  'BAY1P27': { occupant: 'Tristan Silva', team: 'Skanwear', status: 'occupied', isNewHire: false },
  'BAY1P28': { occupant: 'Ronel Dacillo', team: 'Skanwear', status: 'occupied', isNewHire: false },
  'BAY1P29': { occupant: 'Pauline Abrenica', team: 'Skanwear', status: 'occupied', isNewHire: false },
  'BAY1P30': { occupant: 'Nicole Gabrielle Gaveria', team: 'Skanwear', status: 'occupied', isNewHire: false },
  'BAY1P31': { occupant: 'Sherwin Bona', team: 'Skanwear', status: 'occupied', isNewHire: false },
  'BAY1P32': { occupant: 'Dennis Bautista', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P33': { occupant: 'Erica Joy Aquino', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P34': { occupant: 'Ivory Jayne Anonuevo', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P35': { occupant: 'TL Joece Marquez', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY1P14': { occupant: 'Miguel Manago', team: 'Imagine Learning', status: 'training', isNewHire: true },
  'BAY1P15': { occupant: 'Mark Bryan Hernandez', team: 'Imagine Learning', status: 'training', isNewHire: true },
  'BAY1P16': { occupant: 'John Edmar Amante', team: 'Imagine Learning', status: 'training', isNewHire: true },
  'BAY1P21': { occupant: 'Mark Duyac', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P22': { occupant: 'Jomar Dausin', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P23': { occupant: 'Kristine Lei Mendoza', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P1':  { occupant: '', team: '', status: 'vacant', isNewHire: false },
  'BAY1P2':  { occupant: 'Jecelle Cubelo', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P3':  { occupant: 'Jessiekelly Eguac', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P4':  { occupant: 'Sheila Romasasa', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P5':  { occupant: 'TL Glen Baluyot', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY1P6':  { occupant: 'James Corales', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P8':  { occupant: 'Dale Villaruel', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P9':  { occupant: 'Adrian Esguerra', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P10': { occupant: 'Lexter Bryan Rivera', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P11': { occupant: 'Prisca del Rosario', team: 'Clearabee', status: 'occupied', isNewHire: false },
  'BAY1P12': { occupant: 'TL Franc Prestoza', team: 'Team Lead', status: 'occupied', isNewHire: false }
};

const OPS3_SEATS = {
  'BAY4P14': { occupant: 'Aaronne', team: 'Harper Group', status: 'occupied', isNewHire: false },
  'BAY4P13': { occupant: 'Blanche', team: 'Harper Group', status: 'occupied', isNewHire: false },
  'BAY4P12': { occupant: 'Jonica', team: 'Harper Group', status: 'occupied', isNewHire: false },
  'BAY4P11': { occupant: 'Marc', team: 'Harper Group', status: 'occupied', isNewHire: false },
  'BAY4P10': { occupant: 'Charisse', team: 'Harper Group', status: 'occupied', isNewHire: false },
  'BAY4P9':  { occupant: 'Jules', team: 'Harper Group', status: 'occupied', isNewHire: false },
  'BAY3P12': { occupant: 'Nicole', team: 'Medex', status: 'occupied', isNewHire: false },
  'BAY3P11': { occupant: 'Mark', team: 'Medex', status: 'occupied', isNewHire: false },
  'BAY3P10': { occupant: 'Evy', team: 'Medex', status: 'occupied', isNewHire: false },
  'BAY3P9':  { occupant: 'Dovher', team: 'Medex', status: 'occupied', isNewHire: false },
  'BAY3P8':  { occupant: 'Christian', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
  'BAY3P7':  { occupant: 'Genesis', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
  'BAY3P6':  { occupant: 'Tricia', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
  'BAY3P5':  { occupant: 'Ma. Crismina Arcilla', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
  'BAY3P4':  { occupant: 'Shekinah', team: 'Cipher Billing', status: 'occupied', isNewHire: false },
  'BAY2P15': { occupant: 'Mary Anjhelyn Cabales', team: 'Carrot Top', status: 'occupied', isNewHire: false },
  'BAY2P14': { occupant: 'Juan Carlos', team: 'Carrot Top', status: 'occupied', isNewHire: false },
  'BAY2P13': { occupant: 'Katrina', team: 'Carrot Top', status: 'occupied', isNewHire: false },
  'BAY2P12': { occupant: 'AJ', team: 'Carrot Top', status: 'occupied', isNewHire: false },
  'BAY2P11': { occupant: 'Alaiah Grean Santiago', team: 'Carrot Top', status: 'occupied', isNewHire: false },
  'BAY2P10': { occupant: 'Mark', team: 'Carrot Top', status: 'occupied', isNewHire: false },
  'BAY2P9':  { occupant: 'Jam', team: 'Carrot Top', status: 'occupied', isNewHire: false },
  'BAY2P7':  { occupant: 'Gian Franco', team: 'Essentials in Writing', status: 'occupied', isNewHire: false },
  'BAY2P6':  { occupant: 'Jasper', team: 'Essentials in Writing', status: 'occupied', isNewHire: false },
  'BAY2P5':  { occupant: 'Jessa', team: 'Essentials in Writing', status: 'occupied', isNewHire: false },
  'BAY2P4':  { occupant: 'BOSS Logins', team: 'DPAC', status: 'occupied', isNewHire: false },
  'BAY2P3':  { occupant: 'Eullysis', team: 'DPAC', status: 'occupied', isNewHire: false },
  'BAY2P2':  { occupant: 'Grace', team: 'DPAC', status: 'occupied', isNewHire: false },
  'BAY1P12': { occupant: 'Jasper Cohley', team: 'Cohley', status: 'occupied', isNewHire: false },
  'BAY1P11': { occupant: 'Hannah Bellafranco', team: 'Fat Pizza', status: 'occupied', isNewHire: false },
  'BAY1P10': { occupant: 'Joann San Pablo', team: 'Fat Pizza', status: 'occupied', isNewHire: false },
  'BAY1P6':  { occupant: 'Jan', team: 'Do Not Pay', status: 'occupied', isNewHire: false },
  'BAY1P5':  { occupant: 'Jerrick', team: 'Do Not Pay', status: 'occupied', isNewHire: false },
  'BAY1P4':  { occupant: 'Ralph Lawrence Ramos', team: 'Do Not Pay', status: 'occupied', isNewHire: false },
  'BAY1P3':  { occupant: 'Bench', team: 'Do Not Pay', status: 'occupied', isNewHire: false },
  'BAY1P2':  { occupant: 'Randall', team: 'Do Not Pay', status: 'occupied', isNewHire: false }
};

const OPS5_SEATS = {
  'BAY4_TL': { occupant: 'Carlo', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY3_TL': { occupant: 'Joemar', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY2_TL': { occupant: 'Gelo', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY1_TL': { occupant: 'Jessa', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY4P68': { occupant: 'Aloha Amarado', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P69': { occupant: 'M-Psyluck Meres', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P70': { occupant: 'John Carlo Borlaza', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P58': { occupant: 'Wenna Montecer', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P59': { occupant: 'Jhon Benedict Oxales', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P60': { occupant: 'Aira Rectin', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P61': { occupant: 'Karen Opeña', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P71': { occupant: 'Criscel Pundan', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P72': { occupant: 'Hydie Untalan', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P73': { occupant: 'Jhan Mark Alegre', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P74': { occupant: 'Aiza Stanislao', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P63': { occupant: 'Ritche Stephen Aquino', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P64': { occupant: 'Maria Rafaela Paloca', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P65': { occupant: 'Christian Macandili', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY4P66': { occupant: 'Jeremiah Reyes', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P49': { occupant: 'Janna Ysabel G. Argonza', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P50': { occupant: 'Jennifer Tan', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P51': { occupant: 'Renee Lyn De Los Reyes', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P52': { occupant: 'Cindy Seda', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P39': { occupant: 'John Patrick Ricafrente', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P40': { occupant: 'Roen Aguillon', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P41': { occupant: 'Sherry Ann Gaudia', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P42': { occupant: 'Gina Ibanez', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P53': { occupant: 'John Dale Rondolos', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P54': { occupant: 'Tristan Jahnn Mabini', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P56': { occupant: 'Jennie Rose Julio', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P57': { occupant: 'Daryl Hernandez', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P44': { occupant: 'Christal Rose Manalo', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P45': { occupant: 'Kyla Aubrey Salazar', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P46': { occupant: 'Zaira Meg Rosales', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P47': { occupant: 'Shynadine Loise Alimon', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY3P48': { occupant: 'Rosauro Ramos Calabinhi', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P30': { occupant: 'Jovany Dionglay', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P31': { occupant: 'Mhikaela Sophia Castro', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P32': { occupant: 'Paul Patanao', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P33': { occupant: 'Chester Huertas', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P20': { occupant: 'Roy Ven Espinol', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P22': { occupant: 'Guill Anne Hernandez', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P23': { occupant: 'Jomar Pacurza', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P34': { occupant: 'Mary Ann Diongzon', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P35': { occupant: 'Kaira Alcontado', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P36': { occupant: 'Jonathan Besilos', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P37': { occupant: 'Harley Putungan', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P38': { occupant: 'Rashella Zapata', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P25': { occupant: 'Kenneth Basquina', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P26': { occupant: 'Ma. Fe Enimedes', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P27': { occupant: 'Gwen Alexis Indepenso', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P28': { occupant: 'John Benedict Cuarto', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY2P29': { occupant: 'Jenifer Espaldon', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P11': { occupant: 'Maria Aina Purificacion', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P12': { occupant: 'Joana Magkawas', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P13': { occupant: 'Emmanuel Lacson', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P14': { occupant: 'Gizelle Briñas', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P3':  { occupant: 'Danica Jean Flores', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P4':  { occupant: 'Evangeline Putungan', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P15': { occupant: 'Effieloraine Oco', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P16': { occupant: 'Lea Aguason', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P17': { occupant: 'Kristine Talag', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P18': { occupant: 'Adrian Castillo', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P19': { occupant: 'Lyndon Nonato', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P6':  { occupant: 'Hernan Petil', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P7':  { occupant: 'Faith Carsylle Mendoza', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P8':  { occupant: 'Joseph Bombane', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P9':  { occupant: 'Grace Rempillo', team: 'Health Carousel', status: 'occupied', isNewHire: false },
  'BAY1P10': { occupant: 'Dexter Sandoval', team: 'Health Carousel', status: 'occupied', isNewHire: false }
};

const OPS7_SEATS = {
  'Bay1P1':  { occupant: 'Catherine Travers', team: 'Travers', status: 'occupied', isNewHire: false },
  'Bay1P2':  { occupant: 'Jeal Travers', team: 'Travers', status: 'occupied', isNewHire: false },
  'Bay1P4':  { occupant: 'Daniella New Travers', team: 'Travers', status: 'occupied', isNewHire: false },
  'Bay1P5':  { occupant: 'Adilyn Travers', team: 'Travers', status: 'occupied', isNewHire: false },
  'Bay1P6':  { occupant: 'Hyzel Travers', team: 'Travers', status: 'occupied', isNewHire: false },
  'Bay1P13': { occupant: 'Samantha Travers', team: 'Travers', status: 'occupied', isNewHire: false },
  'Bay1P10': { occupant: 'New Hire USLS', team: 'USLS', status: 'training', isNewHire: true },
  'Bay1P9':  { occupant: 'Raymond Jaron Alimagno', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay1P8':  { occupant: 'New Hire USLS', team: 'USLS', status: 'training', isNewHire: true },
  'Bay1P7':  { occupant: 'TL Ryan', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'Bay2P1':  { occupant: 'Jewel Bautista', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P2':  { occupant: 'April Medina', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P3':  { occupant: 'Mhikyla Castro', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P4':  { occupant: 'Siena Marasigan', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P5':  { occupant: 'New Hire USLS', team: 'USLS', status: 'training', isNewHire: true },
  'Bay2P6':  { occupant: 'New Hire USLS', team: 'USLS', status: 'training', isNewHire: true },
  'Bay2P13': { occupant: 'Mary Ann Reyes', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P12': { occupant: 'Mervin Reyes', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P11': { occupant: 'Lee Aningalan', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P10': { occupant: 'Joden Dichosa', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P9':  { occupant: 'Vivian De Torres', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P8':  { occupant: 'Elijah Buensalida', team: 'USLS', status: 'occupied', isNewHire: false },
  'Bay2P7':  { occupant: 'Regidon Olivar', team: 'USLS', status: 'occupied', isNewHire: false }
};

const OPS8_SEATS = {
  'BAY2P1':  { occupant: 'Mary Joy Tenerife', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY2P2':  { occupant: 'Diocielle T. Ricafrente', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY2P3':  { occupant: 'Jocelle Tarnate', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY2P4':  { occupant: 'TL Aija', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY2P13': { occupant: 'Blaine Tan', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY2P9':  { occupant: 'Noel Uriza', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY2P8':  { occupant: 'Gian Mateo N. Tiongson', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY2P6':  { occupant: 'Julie Aglipay', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY2P7':  { occupant: 'TL Jomar Bataller', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY1P1':  { occupant: 'Erika Capistrano', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P12': { occupant: 'TL Janice', team: 'Team Lead', status: 'occupied', isNewHire: false },
  'BAY1P2':  { occupant: 'Nicaella Villanueva', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P11': { occupant: 'Alexander R. Caballes', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P3':  { occupant: 'Ernna Clair Pasco', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P8':  { occupant: 'Maribeth Adarme', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P4':  { occupant: 'Catherine Merano', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P9':  { occupant: 'Niel Joyce Evangelista Graciano', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P5':  { occupant: 'Johanna May E. Marasigan', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P13': { occupant: 'Marvin Aningalan', team: 'UTD', status: 'occupied', isNewHire: false },
  'BAY1P6':  { occupant: 'Duke Jasper Chiyuto', team: 'UTD', status: 'occupied', isNewHire: false }
};

const HQ_OPS_DEFAULTS = {
  'OPS 1': { seats: OPS1_SEATS },
  'OPS 3': { seats: OPS3_SEATS },
  'OPS 5': { seats: OPS5_SEATS },
  'OPS 7': { seats: OPS7_SEATS },
  'OPS 8': { seats: OPS8_SEATS }
};

const SITE_ROOM_LAYOUTS = {
  'HQ Seat Plan': HQ_ROOM_LAYOUTS,
  'Candelaria Seat Plan': CANDELARIA_ROOM_LAYOUTS
};

const SITE_OPS_DEFAULTS = {
  'HQ Seat Plan': HQ_OPS_DEFAULTS,
  'Candelaria Seat Plan': CANDELARIA_OPS_DEFAULTS
};

// "View" globals — always reflect whichever site is currently selected.
// Reassigned by switchSite(); every render/edit function below reads through these.
let OPS_LIST = SITE_OPS_LISTS[currentSite];
let ROOM_LAYOUTS = SITE_ROOM_LAYOUTS[currentSite];
let OPS_DEFAULTS = SITE_OPS_DEFAULTS[currentSite];

let currentOps = 'OPS 5';
let selectedSeat = null;
let draggedSeatId = null;
let dbState = {};
let viewingSnapshotSeats = null;
let viewingSnapshotVersionId = null;

function storageKey() { return STORAGE_PREFIX + 'db'; }

// dbState is namespaced per site so that e.g. "OPS 1" in HQ and "OPS 1" in Candelaria
// never collide, even though both sites currently reuse the same OPS numbering.
function dbKey(ops) { return currentSite + '::' + ops; }

function showNotification(text, type = '') {
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
  const toast = document.getElementById('webNotification');
  const textEl = document.getElementById('notificationText');
  toast.className = 'toast-notification active ' + type;
  textEl.textContent = text;

  notificationTimer = setTimeout(() => {
    hideNotification();
  }, 5000);
}

function hideNotification() {
  const toast = document.getElementById('webNotification');
  toast.classList.remove('active');
}
window.hideNotification = hideNotification;

function populateAccountDropdown(selectedVal = '') {
  const select = document.getElementById('teamInput');
  select.innerHTML = '<option value="">-- Select Account --</option>';
  
  let list = opsAccounts[currentOps] ? [...opsAccounts[currentOps]] : [];
  if (!list.includes('Team Lead')) list.push('Team Lead');

  list.sort().forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc;
    opt.textContent = acc;
    if (acc === selectedVal) opt.selected = true;
    select.appendChild(opt);
  });
}

function rowSeatIds(row) {
  const prefix = row.prefix || 'BAY1P';
  if (row.cells) {
    return row.cells
      .filter(c => typeof c === 'number' || typeof c === 'string')
      .map(n => prefix + n);
  }
  return row.ids.map(n => prefix + n);
}

function allSeatIdsUsing(ops, layouts) {
  const ids = [];
  const cfg = layouts[ops] || layouts[Object.keys(layouts)[0]];
  if (cfg.mode === 'grid') {
    (cfg.items || []).forEach(item => { if (item.type === 'seat') ids.push(item.id); });
    return ids;
  }
  if (cfg.type === 'vertical') {
    cfg.columns.forEach(col => {
      col.pairs.forEach(p => { ids.push(p.left); if (p.right) ids.push(p.right); });
      if (col.leadSeat) ids.push(col.leadSeat);
    });
  } else {
    cfg.blocks.forEach(block => {
      if (block.split) {
        if (block.tlSeat) ids.push(block.tlSeat);
        ['left', 'right'].forEach(side => {
          if (block[side] && block[side].rows) {
            block[side].rows.forEach(row => ids.push(...rowSeatIds(row)));
          }
        });
      } else if (block.pairedRows) {
        block.pairedRows.forEach(pr => {
          if (pr.leftId) ids.push(pr.leftId);
          ids.push(...rowSeatIds({ prefix: pr.prefix, cells: pr.cells }));
        });
      } else {
        block.rows.forEach(row => ids.push(...rowSeatIds(row)));
      }
    });
  }
  return ids;
}

function allSeatIds(ops) { return allSeatIdsUsing(ops, ROOM_LAYOUTS); }

function emptySeatsUsing(ops, layouts) {
  const s = {};
  allSeatIdsUsing(ops, layouts).forEach(id => { s[id] = { occupant: '', team: '', status: 'vacant', isNewHire: false }; });
  return s;
}

function emptySeats(ops) { return emptySeatsUsing(ops, ROOM_LAYOUTS); }

function defaultSeatsForUsing(ops, defaults, layouts) {
  const preset = defaults[ops];
  if (preset) {
    const seats = {};
    Object.keys(preset.seats).forEach(id => { seats[id] = { ...preset.seats[id] }; });
    return seats;
  }
  return emptySeatsUsing(ops, layouts);
}

function defaultSeatsFor(ops) { return defaultSeatsForUsing(ops, OPS_DEFAULTS, ROOM_LAYOUTS); }

async function loadDB() {
  let loadedFromServer = false;

  // Primary source of truth: the shared server-side state, so every browser
  // sees the same seat plan instead of each one having its own copy.
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.dbState && Object.keys(payload.dbState).length) {
        dbState = payload.dbState;
      }
      if (payload && payload.opsAccounts) {
        Object.assign(SITE_OPS_ACCOUNTS, payload.opsAccounts);
      }
      loadedFromServer = true;
    }
  } catch (e) {
    // Server briefly unreachable — fall through to the local safety-net copy below.
  }

  if (!loadedFromServer) {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) dbState = JSON.parse(raw);

      let accRaw = localStorage.getItem(STORAGE_PREFIX + 'ops-accounts');
      if (accRaw) {
        const parsedAcc = JSON.parse(accRaw);
        if (parsedAcc && (parsedAcc['HQ Seat Plan'] || parsedAcc['Candelaria Seat Plan'])) {
          if (parsedAcc['HQ Seat Plan']) SITE_OPS_ACCOUNTS['HQ Seat Plan'] = parsedAcc['HQ Seat Plan'];
          if (parsedAcc['Candelaria Seat Plan']) SITE_OPS_ACCOUNTS['Candelaria Seat Plan'] = parsedAcc['Candelaria Seat Plan'];
        } else if (parsedAcc) {
          // Migrate pre-multi-site flat account list (was HQ-only) into the new namespace.
          SITE_OPS_ACCOUNTS['HQ Seat Plan'] = parsedAcc;
        }
      }
    } catch (e) {}
  }

  // Migrate pre-multi-site data: older versions stored dbState flatly keyed by OPS
  // name only (e.g. "OPS 1"). Move any such entries under the HQ Seat Plan namespace
  // so existing staged/committed data isn't lost.
  SITE_OPS_LISTS['HQ Seat Plan'].forEach(ops => {
    if (dbState[ops] && !dbState['HQ Seat Plan::' + ops]) {
      dbState['HQ Seat Plan::' + ops] = dbState[ops];
      delete dbState[ops];
    }
  });

  opsAccounts = SITE_OPS_ACCOUNTS[currentSite];

  SITE_LIST.forEach(site => {
    const opsList = SITE_OPS_LISTS[site];
    const layouts = SITE_ROOM_LAYOUTS[site];
    const defaults = SITE_OPS_DEFAULTS[site];
    opsList.forEach(ops => {
      const key = site + '::' + ops;
      if (!dbState[key]) {
        const initSeats = defaultSeatsForUsing(ops, defaults, layouts);
        dbState[key] = {
          liveSeats: JSON.parse(JSON.stringify(initSeats)),
          draftSeats: null,
          snapshots: [
            {
              versionId: 'v-initial-' + Date.now(),
              date: ops + ' — Baseline Layout',
              seats: JSON.parse(JSON.stringify(initSeats)),
              summary: 'Initial baseline layout.'
            }
          ]
        };
      }
    });
  });
}

async function saveDB() {
  // Primary: persist to the shared server-side store so every browser stays in sync.
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbState, opsAccounts: SITE_OPS_ACCOUNTS })
    });
  } catch (e) {
    // Server briefly unreachable — the localStorage mirror below still keeps
    // this browser's session working until the next successful save.
  }

  // Secondary: mirror to localStorage as a same-browser safety net.
  try {
    localStorage.setItem(storageKey(), JSON.stringify(dbState));
    localStorage.setItem(STORAGE_PREFIX + 'ops-accounts', JSON.stringify(SITE_OPS_ACCOUNTS));
  } catch (e) {}
}

function getActiveDisplaySeats() {
  if (viewingSnapshotSeats) return viewingSnapshotSeats;
  const room = dbState[dbKey(currentOps)];
  return room.draftSeats ? room.draftSeats : room.liveSeats;
}

function hasActiveDraft() {
  return !viewingSnapshotSeats && dbState[dbKey(currentOps)] && dbState[dbKey(currentOps)].draftSeats !== null;
}

function countByStatus(seatObj, ops = currentOps) {
  const out = { occupied: 0, training: 0, reserved: 0, vacant: 0 };
  if (!seatObj) return out;
  
  const totalIds = allSeatIds(ops);
  
  totalIds.forEach(id => {
    const s = seatObj[id];
    if (!s || !s.status || s.status === 'vacant' || s.occupant === '') {
      out.vacant++;
    } else if (out[s.status] !== undefined) {
      out[s.status]++;
    } else {
      out.vacant++;
    }
  });
  
  return out;
}

function totalSeats(ops) { return allSeatIds(ops).length; }

// Wraps a full room/site re-render in a brief, subtle fade so switching OPS
// tabs, sites, or committing/discarding a plan doesn't feel like an abrupt
// content swap. Kept short (110ms) so it reads as a transition, not a delay.
// Note: renderFloatingBar() fully overwrites #floorRoot's className as part
// of its normal mode-badge logic, which would wipe the fade class mid-flight
// — so we re-apply it after applyFn() runs and force a reflow before
// releasing it, guaranteeing the fade-in actually animates.
function withRoomTransition(applyFn, afterFn) {
  const floor = document.getElementById('floorRoot');
  const stats = document.getElementById('statsBar');
  const opsName = document.getElementById('floorOpsName');

  const fadeOut = () => {
    floor.classList.add('room-switching');
    if (stats) stats.classList.add('fading');
    if (opsName) opsName.classList.add('fading');
  };

  fadeOut();
  setTimeout(() => {
    applyFn();
    fadeOut();
    void floor.offsetWidth; // force reflow so the browser commits the faded-out state first
    requestAnimationFrame(() => {
      floor.classList.remove('room-switching');
      if (stats) stats.classList.remove('fading');
      if (opsName) opsName.classList.remove('fading');
      if (typeof afterFn === 'function') afterFn();
    });
  }, 110);
}

function renderTabs() {
  const tabsWrap = document.getElementById('tabs');
  tabsWrap.innerHTML = '';
  OPS_LIST.forEach(ops => {
    const room = dbState[dbKey(ops)];
    const seats = room.draftSeats ? room.draftSeats : room.liveSeats;
    const c = countByStatus(seats, ops);
    const total = totalSeats(ops);
    const active = c.occupied + c.training;
    const div = document.createElement('div');
    div.className = 'tab' + (ops === currentOps && !viewingSnapshotSeats ? ' active' : '') + (room.draftSeats ? ' has-draft' : '');
    div.title = active + ' occupied of ' + total + ' total seats';
    div.innerHTML = ops + '<span class="count">' + active + '/' + total + '</span><span class="tab-dot"></span>';
    div.addEventListener('click', () => {
      viewingSnapshotSeats = null;
      viewingSnapshotVersionId = null;
      switchOps(ops);
    });
    tabsWrap.appendChild(div);
  });
}

function renderStats() {
  const seats = getActiveDisplaySeats();
  const c = countByStatus(seats);
  const active = c.occupied + c.training;
  const bar = document.getElementById('statsBar');
  bar.innerHTML =
    '<div class="stat-chip grey"><div class="label">Total</div><div class="value">' + totalSeats(currentOps) + '</div></div>' +
    '<div class="stat-chip active-chip"><div class="label">Total of Occupied</div><div class="value">' + active + '</div></div>' +
    '<div class="stat-chip vacant-chip"><div class="label">Total of Vacant</div><div class="value">' + c.vacant + '</div></div>';
}

function renderFloatingBar() {
  const bar = document.getElementById('floatingSaveBar');
  const rootFloor = document.getElementById('floorRoot');
  const returnBanner = document.getElementById('snapshotReturnBanner');

  if (viewingSnapshotSeats) {
    bar.classList.remove('active');
    returnBanner.style.display = 'block';
    document.getElementById('modeBadge').textContent = 'Version Preview';
    document.getElementById('modeBadge').style.background = '#dbeafe';
    document.getElementById('modeBadge').style.color = '#1e40af';
    rootFloor.className = 'floor read-only-preview';
    return;
  }

  returnBanner.style.display = 'none';
  rootFloor.className = 'floor';
  if (hasActiveDraft()) {
    bar.classList.add('active');
    document.getElementById('floatingRoomName').textContent = currentOps;
    document.getElementById('modeBadge').textContent = 'Staged Draft';
    document.getElementById('modeBadge').style.background = '#fef3c7';
    document.getElementById('modeBadge').style.color = '#92400e';
    rootFloor.classList.add('preview-mode');
  } else {
    bar.classList.remove('active');
    document.getElementById('modeBadge').textContent = 'Live Mode';
    document.getElementById('modeBadge').style.background = '#e2e8f0';
    document.getElementById('modeBadge').style.color = '#475569';
  }
}

async function switchOps(ops, afterFn) {
  selectedSeat = null;
  document.getElementById('panel').classList.remove('open');
  withRoomTransition(() => {
    currentOps = ops;
    document.getElementById('floorOpsName').textContent = ops;
    renderTabs();
    renderStats();
    renderFloatingBar();
    renderFloor();
  }, afterFn);
}

function switchSite(site) {
  if (!SITE_OPS_LISTS[site] || site === currentSite) return;

  currentSite = site;
  OPS_LIST = SITE_OPS_LISTS[site];
  ROOM_LAYOUTS = SITE_ROOM_LAYOUTS[site];
  OPS_DEFAULTS = SITE_OPS_DEFAULTS[site];
  opsAccounts = SITE_OPS_ACCOUNTS[site];

  viewingSnapshotSeats = null;
  viewingSnapshotVersionId = null;
  selectedSeat = null;
  document.getElementById('panel').classList.remove('open');
  currentOps = OPS_LIST[0];

  const sitePillLabel = document.getElementById('sitePillLabel');
  if (sitePillLabel) sitePillLabel.textContent = site;
  document.querySelectorAll('.site-pill-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-site') === site);
  });

  withRoomTransition(() => {
    document.getElementById('floorOpsName').textContent = currentOps;
    renderTabs();
    renderStats();
    renderFloatingBar();
    renderFloor();
  });
  showNotification('Switched to ' + site + '.', '', true);
}
window.switchSite = switchSite;

function handleDragStart(e, id) {
  if (viewingSnapshotSeats) return;
  draggedSeatId = id;
  e.dataTransfer.setData('text/plain', id);
  this.classList.add('dragging');
}

function handleDragOver(e) {
  if (viewingSnapshotSeats) return;
  e.preventDefault();
  this.classList.add('drag-over');
}

function handleDragLeave() {
  this.classList.remove('drag-over');
}

function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.seat').forEach(s => s.classList.remove('drag-over'));
}

async function handleDrop(e, targetId) {
  if (viewingSnapshotSeats) return;
  e.preventDefault();
  this.classList.remove('drag-over');
  if (!draggedSeatId || draggedSeatId === targetId) return;

  const room = dbState[dbKey(currentOps)];
  if (!room.draftSeats) {
    room.draftSeats = JSON.parse(JSON.stringify(room.liveSeats));
  }

  const temp = { ...room.draftSeats[draggedSeatId] };
  room.draftSeats[draggedSeatId] = { ...room.draftSeats[targetId] };
  room.draftSeats[targetId] = temp;

  [draggedSeatId, targetId].forEach(sid => {
    if (!room.draftSeats[sid].occupant || room.draftSeats[sid].occupant.trim() === '') {
      room.draftSeats[sid].occupant = '';
      room.draftSeats[sid].team = '';
      room.draftSeats[sid].status = 'vacant';
      room.draftSeats[sid].isNewHire = false;
    }
  });

  await saveDB();
  renderTabs();
  renderStats();
  renderFloatingBar();
  renderFloor();
}

function getAccountPaletteClass(teamName) {
  if (!teamName || teamName === '' || teamName === 'Team Lead') return '';
  const currentList = opsAccounts[currentOps] || [];
  let index = currentList.indexOf(teamName);
  if (index === -1) {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    index = Math.abs(hash);
  }
  const paletteIndex = (index % 5) + 1;
  return 'acc-palette-' + paletteIndex;
}

function seatEl(id, isLead = false) {
  const displaySeats = getActiveDisplaySeats();
  const liveSeats = dbState[dbKey(currentOps)].liveSeats;

  const seat = displaySeats[id] || { occupant: '', team: '', status: 'vacant', isNewHire: false };
  const liveSeat = liveSeats[id] || { occupant: '', team: '', status: 'vacant', isNewHire: false };

  const isModified = !viewingSnapshotSeats && hasActiveDraft() && (
    seat.occupant !== liveSeat.occupant ||
    seat.team !== liveSeat.team ||
    seat.status !== liveSeat.status ||
    !!seat.isNewHire !== !!liveSeat.isNewHire
  );

  let statusClass = seat.status;
  if (seat.status === 'occupied' && seat.team) {
    statusClass = getAccountPaletteClass(seat.team);
    if (!statusClass) statusClass = 'occupied-default';
  } else if (seat.status === 'occupied') {
    statusClass = 'occupied-default';
  }

  const div = document.createElement('div');
  div.className = 'seat ' + statusClass + 
                  (selectedSeat === id ? ' selected' : '') + 
                  (isLead ? ' tl-lead-seat' : '') +
                  (isModified ? ' modified-seat' : '') +
                  (seat.isNewHire ? ' new-hire' : '');
  div.draggable = !viewingSnapshotSeats;
  div.dataset.seatId = id;

  const fallback = seat.status === 'vacant' ? 'Vacant' : (seat.status === 'training' ? 'Training' : 'Reserved');
  div.innerHTML = '<span class="occ">' + (seat.occupant ? seat.occupant : fallback) + '</span>' +
                  (seat.team ? '<span class="team">' + seat.team + '</span>' : '') +
                  '<span class="sid">' + id + '</span>';

  if (!viewingSnapshotSeats) {
    div.addEventListener('click', () => openPanel(id));
    div.addEventListener('dragstart', (e) => handleDragStart.call(div, e, id));
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('dragleave', handleDragLeave);
    div.addEventListener('dragend', handleDragEnd);
    div.addEventListener('drop', (e) => handleDrop.call(div, e, id));
  }

  return div;
}

function emptySlotEl(span) {
  const div = document.createElement('div');
  div.className = 'seat empty-slot';
  if (span && span !== 1) div.style.flex = span + ' ' + span + ' 0%';
  return div;
}

function aisleEl(span) {
  const div = document.createElement('div');
  div.className = 'aisle-slot';
  div.style.flex = (span || 1) + ' ' + (span || 1) + ' 0%';
  const label = document.createElement('span');
  label.className = 'aisle-label';
  label.textContent = 'AISLE';
  div.appendChild(label);
  return div;
}

function cellEl(cell, prefix) {
  if (cell === null || cell === undefined) return emptySlotEl(1);
  if (typeof cell === 'number' || typeof cell === 'string') return seatEl(prefix + cell);
  if (cell.aisle) return aisleEl(cell.aisle);
  if (cell.empty) return emptySlotEl(cell.empty);
  return emptySlotEl(1);
}

function renderRows(rowsData) {
  const rowsDiv = document.createElement('div');
  rowsDiv.className = 'bay-rows';
  rowsData.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'bay-row';
    const prefix = row.prefix || 'BAY1P';
    if (row.cells) {
      row.cells.forEach(cell => rowDiv.appendChild(cellEl(cell, prefix)));
    } else {
      row.ids.forEach(n => rowDiv.appendChild(seatEl(prefix + n)));
      for (let i = row.width; i < (row.maxCol || row.width); i++) rowDiv.appendChild(emptySlotEl());
    }
    rowsDiv.appendChild(rowDiv);
  });
  return rowsDiv;
}

function renderGridFloor(root, cfg) {
  const grid = document.createElement('div');
  grid.className = 'floor-grid';
  grid.style.gridTemplateColumns = cfg.colTemplate || ('repeat(' + cfg.cols + ', 1fr)');

  (cfg.items || []).forEach(item => {
    let el;
    if (item.type === 'seat') {
      el = seatEl(item.id);
    } else if (item.type === 'gap') {
      el = document.createElement('div');
      el.className = 'grid-item-gap' + (item.horizontal ? ' grid-item-gap-h' : '');
      const label = document.createElement('span');
      label.className = 'aisle-label' + (item.horizontal ? ' aisle-label-h' : '');
      label.textContent = 'AISLE';
      el.appendChild(label);
    } else if (item.type === 'door') {
      el = document.createElement('div');
      el.className = 'grid-item-door';
      const doorTag = document.createElement('span');
      doorTag.className = 'door-tag';
      doorTag.textContent = 'DOOR';
      el.appendChild(doorTag);
    } else if (item.type === 'label') {
      el = document.createElement('div');
      el.className = 'grid-bay-label';
      el.textContent = item.text;
    } else {
      return;
    }
    el.style.gridRow = (item.row + 1) + ' / span ' + (item.rowSpan || 1);
    el.style.gridColumn = (item.col + 1) + ' / span ' + (item.colSpan || 1);
    grid.appendChild(el);
  });

  root.appendChild(grid);
}

function renderFloor() {
  const root = document.getElementById('floorRoot');
  root.innerHTML = '';
  const cfg = ROOM_LAYOUTS[currentOps] || ROOM_LAYOUTS['OPS 1'];

  if (cfg.mode === 'grid') {
    renderGridFloor(root, cfg);
    return;
  }

  if (cfg.type === 'vertical') {
    const vertContainer = document.createElement('div');
    vertContainer.className = 'vertical-bays-container';

    cfg.columns.forEach(col => {
      const colDiv = document.createElement('div');
      colDiv.className = 'bay-column';

      if (col.bayName) {
        const title = document.createElement('div');
        title.className = 'bay-title';
        title.textContent = col.bayName;
        colDiv.appendChild(title);
      }

      const rowsDiv = document.createElement('div');
      rowsDiv.className = 'bay-rows';
      col.pairs.forEach(pair => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'bay-row';
        rowDiv.appendChild(seatEl(pair.left));
        if (pair.right) rowDiv.appendChild(seatEl(pair.right));
        rowsDiv.appendChild(rowDiv);
      });
      colDiv.appendChild(rowsDiv);

      if (col.leadSeat) {
        const leadBlock = document.createElement('div');
        leadBlock.className = 'lead-seat-block';
        if (col.leadTitle) {
          const lTitle = document.createElement('div');
          lTitle.className = 'lead-title';
          lTitle.textContent = col.leadTitle;
          leadBlock.appendChild(lTitle);
        }
        leadBlock.appendChild(seatEl(col.leadSeat, true));
        colDiv.appendChild(leadBlock);
      }

      if (col.showDoor) {
        const metaRow = document.createElement('div');
        metaRow.className = 'floor-meta-row';
        const doorDiv = document.createElement('div');
        doorDiv.className = 'door-tag';
        doorDiv.textContent = 'DOOR';
        metaRow.appendChild(doorDiv);
        colDiv.appendChild(metaRow);
      }
      vertContainer.appendChild(colDiv);
    });
    root.appendChild(vertContainer);
    return;
  }

  if (currentOps === 'OPS 5' && currentSite === 'HQ Seat Plan') {
    const headerRow = document.createElement('div');
    headerRow.className = 'floor-header';
    headerRow.innerHTML = '<div></div><div class="exit-tag">' +
      '<svg viewBox="0 0 18 18" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2"></path><path d="M6 9h8"></path><path d="M11.5 5.5 15 9l-3.5 3.5"></path></svg>' +
      'FIRE EXIT</div>';
    root.appendChild(headerRow);
  }

  cfg.blocks.forEach(block => {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'bay-block' + (block.tight ? ' tight' : '');

    if (block.bayName) {
      const title = document.createElement('div');
      title.className = 'bay-title';
      title.textContent = block.bayName;
      blockDiv.appendChild(title);
    }

    if (block.split) {
      const container = document.createElement('div');
      container.className = 'split-bay-container';

      const leftSide = document.createElement('div');
      leftSide.className = 'split-side';
      leftSide.appendChild(renderRows(block.left.rows));
      container.appendChild(leftSide);

      if (block.tlSeat) {
        const tlContainer = document.createElement('div');
        tlContainer.style.display = 'flex';
        tlContainer.style.flexDirection = 'column';
        tlContainer.style.justifyContent = 'center';
        tlContainer.style.width = '75px';
        tlContainer.appendChild(seatEl(block.tlSeat, true));
        container.appendChild(tlContainer);
      }

      const rightSide = document.createElement('div');
      rightSide.className = 'split-side';
      rightSide.appendChild(renderRows(block.right.rows));
      container.appendChild(rightSide);

      blockDiv.appendChild(container);
    } else if (block.leftDoorRows) {
      // Door rendered as a real box to the left, spanning exactly the rows
      // it belongs to (not the full block/floor width).
      const doorRows = block.rows.slice(0, block.leftDoorRows);
      const restRows = block.rows.slice(block.leftDoorRows);

      const doorGroup = document.createElement('div');
      doorGroup.className = 'door-row-group';
      const doorBox = document.createElement('div');
      doorBox.className = 'door-box-left';
      const doorBoxTag = document.createElement('span');
      doorBoxTag.className = 'door-tag';
      doorBoxTag.textContent = 'DOOR';
      doorBox.appendChild(doorBoxTag);
      doorGroup.appendChild(doorBox);
      doorGroup.appendChild(renderRows(doorRows));
      blockDiv.appendChild(doorGroup);

      if (restRows.length) blockDiv.appendChild(renderRows(restRows));
    } else if (block.pairedRows) {
      // Each entry pairs a standalone left-side cubicle (e.g. BAY 3 seats)
      // with one row of the main bay, and optionally a door on the right —
      // used when a side column of single cubicles lines up row-by-row
      // against the main grid instead of stacking as its own block.
      const container = document.createElement('div');
      container.className = 'paired-rows-container';
      block.pairedRows.forEach(pr => {
        const group = document.createElement('div');
        group.className = 'left-column-row-group';

        const leftWrap = document.createElement('div');
        leftWrap.className = 'left-column-cell' + (pr.leftId ? '' : ' left-column-spacer');
        if (pr.leftId) leftWrap.appendChild(seatEl(pr.leftId));
        group.appendChild(leftWrap);

        group.appendChild(renderRows([{ prefix: pr.prefix, cells: pr.cells }]));

        if (pr.rightDoor) {
          const doorBox = document.createElement('div');
          doorBox.className = 'door-box-right';
          const doorBoxTag = document.createElement('span');
          doorBoxTag.className = 'door-tag';
          doorBoxTag.textContent = 'DOOR';
          doorBox.appendChild(doorBoxTag);
          group.appendChild(doorBox);
        }

        container.appendChild(group);
      });
      blockDiv.appendChild(container);
    } else {
      blockDiv.appendChild(renderRows(block.rows));
    }

    if (block.showDoorCenter || block.showDoor || block.showDoorLeft) {
      const metaRow = document.createElement('div');
      metaRow.className = 'floor-meta-row';
      metaRow.style.justifyContent = block.showDoorCenter ? 'center' : (block.showDoorLeft ? 'flex-start' : 'flex-end');
      const doorDiv = document.createElement('div');
      doorDiv.className = 'door-tag';
      doorDiv.textContent = 'DOOR';
      metaRow.appendChild(doorDiv);
      blockDiv.appendChild(metaRow);
    }
    root.appendChild(blockDiv);

    if (block.aisleAfter) {
      const band = document.createElement('div');
      band.className = 'aisle-band';
      const label = document.createElement('span');
      label.className = 'aisle-label';
      label.textContent = 'AISLE';
      band.appendChild(label);
      root.appendChild(band);
    }
  });
}

function openPanel(id) {
  if (viewingSnapshotSeats) return;
  selectedSeat = id;
  renderFloor();
  const displaySeats = getActiveDisplaySeats();
  const seat = displaySeats[id] || { occupant: '', team: '', status: 'vacant', isNewHire: false };
  document.getElementById('panelSeatIdLabel').textContent = id;
  document.getElementById('occInput').value = seat.occupant || '';
  
  populateAccountDropdown(seat.team || '');

  document.getElementById('newHireInput').checked = !!seat.isNewHire;
  document.getElementById('panel').classList.add('open');
  document.getElementById('occInput').focus();
}

function closePanel() {
  selectedSeat = null;
  document.getElementById('panel').classList.remove('open');
  renderFloor();
}
window.closePanel = closePanel;

async function saveSeatEdit() {
  if (!selectedSeat || viewingSnapshotSeats) return;

  const occInputEl = document.getElementById('occInput');
  const teamInputEl = document.getElementById('teamInput');
  const occupantName = occInputEl.value.trim();

  // An occupant needs an account/team on record — only a fully cleared seat
  // (no name) is allowed to skip it.
  if (occupantName && !teamInputEl.value) {
    teamInputEl.classList.add('field-invalid');
    teamInputEl.focus();
    showNotification('Please select an account for this agent before saving.', 'warning');
    setTimeout(() => teamInputEl.classList.remove('field-invalid'), 900);
    return;
  }

  showWebDialog({
    title: 'Confirm Changes',
    message: 'Are you sure you want to apply changes to seat ' + selectedSeat + '?',
    type: 'confirm',
    onConfirm: async () => {
      const occInput = document.getElementById('occInput');
      const teamInput = document.getElementById('teamInput');
      const newHireInput = document.getElementById('newHireInput');

      let newOccupant = occInput.value.trim();
      let newTeam = teamInput.value;
      let isNewHire = newHireInput.checked;
      let newStatus = 'vacant';

      if (!newOccupant) {
        newOccupant = '';
        newTeam = '';
        newStatus = 'vacant';
        isNewHire = false;
      } else {
        newStatus = isNewHire ? 'training' : 'occupied';
      }

      const room = dbState[dbKey(currentOps)];
      if (!room.draftSeats) {
        room.draftSeats = JSON.parse(JSON.stringify(room.liveSeats));
      }

      room.draftSeats[selectedSeat] = {
        occupant: newOccupant,
        team: newTeam,
        status: newStatus,
        isNewHire: isNewHire
      };

      await saveDB();
      closePanel();
      renderTabs();
      renderStats();
      renderFloatingBar();
      renderFloor();
      showNotification('Seat changes staged successfully.', 'warning');
    }
  });
}

async function offboardSeat() {
  if (!selectedSeat || viewingSnapshotSeats) return;
  
  showWebDialog({
    title: 'Confirm Offboard',
    message: 'Are you sure you want to offboard and clear seat ' + selectedSeat + '?',
    type: 'confirm',
    onConfirm: async () => {
      const room = dbState[dbKey(currentOps)];
      if (!room.draftSeats) {
        room.draftSeats = JSON.parse(JSON.stringify(room.liveSeats));
      }

      room.draftSeats[selectedSeat] = {
        occupant: '',
        team: '',
        status: 'vacant',
        isNewHire: false
      };

      await saveDB();
      closePanel();
      renderTabs();
      renderStats();
      renderFloatingBar();
      renderFloor();
      showNotification('Seat offboarded and marked vacant.', 'success', true);
    }
  });
}

async function discardDraft() {
  if (viewingSnapshotSeats) return;
  
  showWebDialog({
    title: 'Confirm Discard',
    message: 'Are you sure you want to discard all staged draft changes?',
    type: 'confirm',
    onConfirm: async () => {
      dbState[dbKey(currentOps)].draftSeats = null;
      await saveDB();
      withRoomTransition(() => {
        renderTabs();
        renderStats();
        renderFloatingBar();
        renderFloor();
      });
      showNotification('Draft changes discarded.', '');
    }
  });
}

async function clearAllNewHireTags() {
  if (viewingSnapshotSeats) return;

  const room = dbState[dbKey(currentOps)];
  const activeSeats = room.draftSeats || room.liveSeats;
  const taggedCount = Object.values(activeSeats).filter(s => s && s.isNewHire).length;

  if (taggedCount === 0) {
    showNotification('No ★ New Hire tags in ' + currentOps + ' right now.', '');
    return;
  }

  showWebDialog({
    title: 'Clear New Hire Tags',
    message: 'Remove the ★ New Hire tag from all ' + taggedCount + ' tagged seat(s) in ' + currentOps + '? Seats currently marked Training will be set to Occupied.',
    type: 'confirm',
    onConfirm: async () => {
      if (!room.draftSeats) {
        room.draftSeats = JSON.parse(JSON.stringify(room.liveSeats));
      }

      Object.keys(room.draftSeats).forEach(id => {
        const seat = room.draftSeats[id];
        if (seat && seat.isNewHire) {
          seat.isNewHire = false;
          if (seat.status === 'training') seat.status = 'occupied';
        }
      });

      await saveDB();
      closePanel();
      renderTabs();
      renderStats();
      renderFloatingBar();
      renderFloor();
      showNotification('New hire tags cleared for ' + currentOps + ' (staged — commit to make it live).', 'warning');
    }
  });
}
window.clearAllNewHireTags = clearAllNewHireTags;

async function commitFullSeatPlan() {
  const room = dbState[dbKey(currentOps)];
  if (!room.draftSeats || viewingSnapshotSeats) return;

  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const snapshotLabel = currentOps + ' — ' + nowStr;
  
  const newSnap = {
    versionId: 'v-' + Date.now(),
    date: snapshotLabel,
    seats: JSON.parse(JSON.stringify(room.draftSeats)),
    summary: 'Committed layout revision'
  };

  room.liveSeats = room.draftSeats;
  room.draftSeats = null;
  room.snapshots.push(newSnap);

  await saveDB();
  withRoomTransition(() => {
    renderTabs();
    renderStats();
    renderFloatingBar();
    renderFloor();
  });
  
  showNotification('Seat plan successfully committed and saved.', 'success', true);
}

const TRASH_ICON_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';

function openHistoryModal() {
  const room = dbState[dbKey(currentOps)];
  const modalBody = document.getElementById('modalBody');
  document.getElementById('modalTitle').textContent = currentOps + ' — Previous Versions';

  if (!room.snapshots || room.snapshots.length === 0) {
    modalBody.innerHTML = '<div class="version-empty"><div class="version-empty-icon">🗂️</div>No previous versions saved yet.</div>';
    document.getElementById('historyModal').classList.add('open');
    return;
  }

  let html = '';
  const currentVersionId = room.snapshots[room.snapshots.length - 1].versionId;
  room.snapshots.slice().reverse().forEach((snap) => {
    const isCurrent = snap.versionId === currentVersionId;
    html += '<div class="version-item" data-version-id="' + snap.versionId + '">' +
      '<div class="version-info">' +
        '<div class="v-name">' + snap.date + (isCurrent ? ' <span class="v-current-badge">Current</span>' : '') + '</div>' +
        '<div class="v-date">' + snap.summary + '</div>' +
      '</div>' +
      '<div class="version-actions">' +
        '<button class="subtle" style="padding:4px 10px; font-size:11px;" onclick="previewSnapshotVersion(\'' + snap.versionId + '\')">Preview Version</button>' +
        (isCurrent ?
          '<button class="version-delete-btn" disabled title="The current version can\'t be deleted">' + TRASH_ICON_SVG + '</button>' :
          '<button class="version-delete-btn" title="Delete this version" onclick="deleteSnapshotVersion(\'' + snap.versionId + '\')">' + TRASH_ICON_SVG + '</button>') +
      '</div>' +
    '</div>';
  });

  modalBody.innerHTML = html;
  document.getElementById('historyModal').classList.add('open');
}

function closeHistoryModal() {
  document.getElementById('historyModal').classList.remove('open');
}

window.deleteSnapshotVersion = function(versionId) {
  const room = dbState[dbKey(currentOps)];
  const targetSnap = room.snapshots.find(s => s.versionId === versionId);
  if (!targetSnap) return;

  const currentVersionId = room.snapshots[room.snapshots.length - 1].versionId;
  if (versionId === currentVersionId) {
    showWebDialog({ title: 'Notice', message: "The current version can't be deleted.", type: 'alert' });
    return;
  }

  showWebDialog({
    title: 'Delete Version',
    message: 'Delete the saved version "' + targetSnap.date + '"?',
    type: 'confirm',
    onConfirm: async () => {
      const itemEl = document.querySelector('.version-item[data-version-id="' + versionId + '"]');

      const finishDelete = async () => {
        room.snapshots = room.snapshots.filter(s => s.versionId !== versionId);

        if (viewingSnapshotVersionId === versionId) {
          viewingSnapshotSeats = null;
          viewingSnapshotVersionId = null;
          withRoomTransition(() => {
            renderTabs();
            renderStats();
            renderFloatingBar();
            renderFloor();
          });
        }

        await saveDB();
        openHistoryModal();
        showNotification('Version "' + targetSnap.date + '" deleted.', 'warning');
      };

      if (itemEl) {
        itemEl.classList.add('removing');
        setTimeout(finishDelete, 200);
      } else {
        finishDelete();
      }
    }
  });
};

window.previewSnapshotVersion = function(versionId) {
  const room = dbState[dbKey(currentOps)];
  const targetSnap = room.snapshots.find(s => s.versionId === versionId);
  if (!targetSnap) return;

  viewingSnapshotSeats = JSON.parse(JSON.stringify(targetSnap.seats));
  viewingSnapshotVersionId = versionId;
  closeHistoryModal();
  withRoomTransition(() => {
    renderStats();
    renderFloatingBar();
    renderFloor();
  });
  showNotification('Now viewing read-only preview: ' + targetSnap.date, 'warning');
};

window.exitSnapshotPreview = function() {
  viewingSnapshotSeats = null;
  viewingSnapshotVersionId = null;
  withRoomTransition(() => {
    renderTabs();
    renderStats();
    renderFloatingBar();
    renderFloor();
  });
  showNotification('Returned to active live session.', '');
};

document.getElementById('teamInput').addEventListener('change', function() {
  this.classList.remove('field-invalid');
});

document.getElementById('addAccountBtn').addEventListener('click', async () => {
  showWebDialog({
    title: 'Add Account',
    message: 'Enter name of new account for ' + currentOps + ':',
    type: 'prompt',
    placeholder: 'Account name',
    onConfirm: async (val) => {
      if (val && val.trim() !== '') {
        const formatted = val.trim();
        if (!opsAccounts[currentOps]) opsAccounts[currentOps] = [];
        if (!opsAccounts[currentOps].includes(formatted)) {
          opsAccounts[currentOps].push(formatted);
          await saveDB();
          populateAccountDropdown(formatted);
          showNotification('New account added to ' + currentOps + '.', 'success', true);
        } else {
          showWebDialog({ title: 'Notice', message: 'Account already exists in ' + currentOps + '.', type: 'alert' });
        }
      }
    }
  });
});

document.getElementById('removeAccountBtn').addEventListener('click', async () => {
  let list = opsAccounts[currentOps] || [];
  if (list.length === 0) {
    showWebDialog({ title: 'Notice', message: 'No custom accounts found for ' + currentOps + '.', type: 'alert' });
    return;
  }
  
  const modalOverlay = document.getElementById('customDialogOverlay');
  const titleEl = document.getElementById('dialogTitle');
  const msgEl = document.getElementById('dialogMessage');
  const iconEl = document.getElementById('dialogIcon');
  const inputEl = document.getElementById('dialogInput');
  const actionsEl = document.getElementById('dialogActions');

  titleEl.textContent = 'Remove Account';
  msgEl.textContent = 'Select an account to remove from ' + currentOps + ':';
  iconEl.textContent = '🗑️';
  actionsEl.innerHTML = '';
  inputEl.style.display = 'none';

  let selectEl = document.getElementById('dialogAccountSelect');
  if (!selectEl) {
    selectEl = document.createElement('select');
    selectEl.id = 'dialogAccountSelect';
    selectEl.className = 'dialog-input';
    selectEl.style.display = 'block';
    msgEl.after(selectEl);
  } else {
    selectEl.style.display = 'block';
  }

  selectEl.innerHTML = '';
  list.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc;
    opt.textContent = acc;
    selectEl.appendChild(opt);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-dialog-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => {
    selectEl.style.display = 'none';
    closeWebDialog();
  };

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn-dialog-primary';
  confirmBtn.textContent = 'Remove';
  confirmBtn.onclick = async () => {
    const selectedAcc = selectEl.value;
    selectEl.style.display = 'none';
    closeWebDialog();
    if (!selectedAcc) return;

    showWebDialog({
      title: 'Confirm Removal',
      message: 'Are you sure you want to remove account "' + selectedAcc + '" from ' + currentOps + '?',
      type: 'confirm',
      onConfirm: async () => {
        const index = opsAccounts[currentOps].indexOf(selectedAcc);
        if (index !== -1) {
          opsAccounts[currentOps].splice(index, 1);
          await saveDB();
          populateAccountDropdown();
          showNotification('Account "' + selectedAcc + '" removed from ' + currentOps + '.', 'warning', true);
        }
      }
    });
  };

  actionsEl.appendChild(cancelBtn);
  actionsEl.appendChild(confirmBtn);
  modalOverlay.classList.add('active-modal');
});

// Unified Export Button Handler
document.getElementById('exportMenuBtn').addEventListener('click', () => {
  const modalOverlay = document.getElementById('customDialogOverlay');
  const titleEl = document.getElementById('dialogTitle');
  const msgEl = document.getElementById('dialogMessage');
  const iconEl = document.getElementById('dialogIcon');
  const inputEl = document.getElementById('dialogInput');
  const actionsEl = document.getElementById('dialogActions');

  titleEl.textContent = 'Export Seat Plan';
  msgEl.textContent = 'Please choose your preferred export format:';
  iconEl.textContent = '📥';
  actionsEl.innerHTML = '';
  inputEl.style.display = 'none';

  const pdfBtn = document.createElement('button');
  pdfBtn.className = 'btn-dialog-secondary';
  pdfBtn.textContent = 'PDF Format';
  pdfBtn.onclick = () => {
    closeWebDialog();
    window.print();
  };

  const excelBtn = document.createElement('button');
  excelBtn.className = 'btn-dialog-primary';
  excelBtn.textContent = 'Excel Format';
  excelBtn.onclick = () => {
    closeWebDialog();
    exportToExcel();
  };

  actionsEl.appendChild(pdfBtn);
  actionsEl.appendChild(excelBtn);
  modalOverlay.classList.add('active-modal');
});

document.getElementById('saveBtn').addEventListener('click', saveSeatEdit);
document.getElementById('offboardBtn').addEventListener('click', offboardSeat);
document.getElementById('cancelBtn').addEventListener('click', closePanel);
document.getElementById('commitPlanBtn').addEventListener('click', commitFullSeatPlan);
document.getElementById('discardDraftBtn').addEventListener('click', discardDraft);
document.getElementById('historyModalBtn').addEventListener('click', openHistoryModal);
document.getElementById('clearNewHireBtn').addEventListener('click', clearAllNewHireTags);
document.getElementById('closeModalBtn').addEventListener('click', closeHistoryModal);

document.getElementById('historyModal').addEventListener('click', (e) => {
  if (e.target.id === 'historyModal') closeHistoryModal();
});

document.getElementById('customDialogOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'customDialogOverlay') {
    const selectEl = document.getElementById('dialogAccountSelect');
    if (selectEl) selectEl.style.display = 'none';
    closeWebDialog();
  }
});

const XLS_COLORS = {
  headerLabel: 'FFF4CCCC',
  roomTag:     'FFB6D7A8',
  seatId:      'FFC9DAF8',
  vacant:      'FFF9D8D3',
  training:    'FFCDEEF2',
  reserved:    'FFFCE5CD',
  occupied:    'FFFFFFFF',
  teamLead:    'FFFFFF00',
  bayHeader:   'FF233B74',
  door:        'FF4A86E8',
  gapFill:     'FFF1F5F9'
};

function xlsxSeatFill(seat) {
  if (!seat || seat.status === 'vacant') return XLS_COLORS.vacant;
  if (seat.status === 'training') return XLS_COLORS.training;
  if (seat.status === 'reserved') return XLS_COLORS.reserved;
  if (seat.team === 'Team Lead') return XLS_COLORS.teamLead;
  return XLS_COLORS.occupied;
}

function xlsxSeatLabel(seat) {
  if (!seat || seat.status === 'vacant' || !seat.occupant) return 'VACANT';
  let label = seat.occupant;
  if (seat.team) label += '\n' + seat.team;
  if (seat.isNewHire) label += '\n(★ New Hire)';
  if (seat.status === 'training') label += '\n(Training)';
  if (seat.status === 'reserved') label += '\n(Reserved)';
  return label;
}

function xlsxThinBorder() {
  const edge = { style: 'thin', color: { argb: 'FFB7C0CC' } };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function xlsxStyleCell(cell, { fill, font, align, border = true } = {}) {
  if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  cell.font = Object.assign({ name: 'Arial', size: 10, color: { argb: 'FF1E293B' } }, font || {});
  cell.alignment = Object.assign({ horizontal: 'center', vertical: 'middle', wrapText: true }, align || {});
  if (border) cell.border = xlsxThinBorder();
}

function xlsxWriteHeader(sheet, ops, seats) {
  const c = countByStatus(seats, ops);
  const total = totalSeats(ops);
  const active = c.occupied + c.training;
  const vacant = c.vacant;

  sheet.mergeCells(1, 1, 2, 1);
  const seatsLbl = sheet.getCell(1, 1);
  seatsLbl.value = 'SEATS';
  xlsxStyleCell(seatsLbl, { fill: XLS_COLORS.headerLabel, font: { bold: true, size: 11 } });

  const labels = [['TOTAL', total], ['TOTAL OF OCCUPIED', active], ['TOTAL OF VACANT', vacant]];
  labels.forEach(([label, value], i) => {
    const col = 2 + i;
    const lblCell = sheet.getCell(1, col);
    lblCell.value = label;
    xlsxStyleCell(lblCell, { fill: XLS_COLORS.headerLabel, font: { bold: true, size: 11 } });

    const valCell = sheet.getCell(2, col);
    valCell.value = value;
    const isSpecial = label === 'TOTAL OF VACANT' || label === 'TOTAL OF OCCUPIED';
    xlsxStyleCell(valCell, {
      fill: isSpecial ? XLS_COLORS.roomTag : XLS_COLORS.headerLabel,
      font: { bold: true, size: 12 }
    });
  });

  sheet.mergeCells(1, 5, 2, 7);
  const roomCell = sheet.getCell(1, 5);
  roomCell.value = ops;
  xlsxStyleCell(roomCell, { fill: XLS_COLORS.roomTag, font: { bold: true, size: 20, color: { argb: 'FF1E3A24' } } });

  sheet.getColumn(1).width = 13;
  for (let col = 2; col <= 7; col++) sheet.getColumn(col).width = 16;
  sheet.getRow(1).height = 20;
  sheet.getRow(2).height = 20;

  return 4;
}

function xlsxWriteSeatCellPair(sheet, nameRow, col, seatId, seat) {
  const nameCell = sheet.getCell(nameRow, col);
  nameCell.value = xlsxSeatLabel(seat);
  xlsxStyleCell(nameCell, { fill: xlsxSeatFill(seat), font: { bold: true, size: 10.5 } });

  const idCell = sheet.getCell(nameRow + 1, col);
  idCell.value = seatId;
  xlsxStyleCell(idCell, { fill: XLS_COLORS.seatId, font: { bold: true, size: 9 } });
}

function xlsxEmptySlot(sheet, nameRow, col) {
  xlsxStyleCell(sheet.getCell(nameRow, col), { fill: XLS_COLORS.gapFill, border: false });
  xlsxStyleCell(sheet.getCell(nameRow + 1, col), { fill: XLS_COLORS.gapFill, border: false });
}

function xlsxSetMinColWidth(sheet, col, width) {
  const current = sheet.getColumn(col).width;
  if (!current || width > current) sheet.getColumn(col).width = width;
}

function xlsxSetGapColWidth(sheet, col, width) {
  if (!sheet.getColumn(col).width) sheet.getColumn(col).width = width;
}

function xlsxCellWidth(cell) {
  if (cell === null || cell === undefined) return 1;
  if (typeof cell === 'number' || typeof cell === 'string') return 1;
  if (cell.aisle) return cell.aisle;
  if (cell.empty) return cell.empty;
  return 1;
}

function xlsxCellsWidth(cells) {
  return (cells || []).reduce((sum, c) => sum + xlsxCellWidth(c), 0);
}

function xlsxRowWidth(row) {
  if (row.cells) return row.cells.reduce((sum, c) => sum + xlsxCellWidth(c), 0);
  return row.maxCol || row.width;
}

function xlsxRowsWidth(rowsArr) {
  return Math.max(...rowsArr.map(xlsxRowWidth));
}

function xlsxWriteRows(sheet, rowsArr, seats, startRow, colOffset) {
  let r = startRow;
  rowsArr.forEach(rowData => {
    const prefix = rowData.prefix || 'BAY1P';
    let col = colOffset;
    if (rowData.cells) {
      rowData.cells.forEach(cell => {
        const w = xlsxCellWidth(cell);
        if (typeof cell === 'number' || typeof cell === 'string') {
          const seatId = prefix + cell;
          xlsxWriteSeatCellPair(sheet, r, col, seatId, seats[seatId]);
        } else if (cell && cell.aisle) {
          sheet.mergeCells(r, col, r + 1, col + w - 1);
          const aisleCell = sheet.getCell(r, col);
          aisleCell.value = 'AISLE';
          xlsxStyleCell(aisleCell, { fill: XLS_COLORS.gapFill, font: { italic: true, size: 8, color: { argb: 'FF94A3B8' } }, border: false });
        } else {
          xlsxEmptySlot(sheet, r, col);
        }
        col += w;
      });
    } else {
      const totalCols = rowData.maxCol || rowData.width;
      for (let i = 0; i < totalCols; i++) {
        const c = colOffset + i;
        if (i < rowData.ids.length) {
          const seatId = prefix + rowData.ids[i];
          xlsxWriteSeatCellPair(sheet, r, c, seatId, seats[seatId]);
        } else {
          xlsxEmptySlot(sheet, r, c);
        }
      }
    }
    r += 2;
  });
  return r;
}

function xlsxWriteDoorTag(sheet, row, col, span) {
  sheet.mergeCells(row, col, row, col + span - 1);
  const cell = sheet.getCell(row, col);
  cell.value = 'DOOR';
  xlsxStyleCell(cell, { fill: XLS_COLORS.door, font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } } });
}

function xlsxCalcBlockWidth(block) {
  if (block.split) {
    return xlsxRowsWidth(block.left.rows) + 1 + xlsxRowsWidth(block.right.rows);
  }
  if (block.pairedRows) {
    const maxRow = Math.max(...block.pairedRows.map(pr => xlsxCellsWidth(pr.cells)), 0);
    const hasDoor = block.pairedRows.some(pr => pr.rightDoor);
    return 1 + maxRow + (hasDoor ? 1 : 0);
  }
  const base = xlsxRowsWidth(block.rows);
  return block.leftDoorRows ? base + 1 : base;
}

function xlsxWriteGridRoom(sheet, ops, cfg, seats, startRow) {
  const rowUnit = 2; // each grid row = a name row + an ID row, same convention as the wide-room writer
  let maxGridRow = 0;

  (cfg.items || []).forEach(item => {
    maxGridRow = Math.max(maxGridRow, item.row + (item.rowSpan || 1));

    const r0 = startRow + item.row * rowUnit;
    const r1 = startRow + (item.row + (item.rowSpan || 1)) * rowUnit - 1;
    const c0 = item.col + 1;
    const c1 = item.col + (item.colSpan || 1);

    if (item.type === 'seat') {
      xlsxWriteSeatCellPair(sheet, r0, c0, item.id, seats[item.id]);
    } else if (item.type === 'gap') {
      sheet.mergeCells(r0, c0, r1, c1);
      const cell = sheet.getCell(r0, c0);
      cell.value = 'AISLE';
      xlsxStyleCell(cell, { fill: XLS_COLORS.gapFill, font: { italic: true, size: 8, color: { argb: 'FF94A3B8' } }, border: false });
    } else if (item.type === 'door') {
      sheet.mergeCells(r0, c0, r1, c1);
      const cell = sheet.getCell(r0, c0);
      cell.value = 'DOOR';
      xlsxStyleCell(cell, { fill: XLS_COLORS.door, font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } } });
    }
  });

  for (let col = 1; col <= cfg.cols; col++) xlsxSetMinColWidth(sheet, col, 13);
  return startRow + maxGridRow * rowUnit + 1;
}

function xlsxWriteWideRoom(sheet, ops, cfg, seats, startRow) {
  let r = startRow;
  let maxWidthSeen = 4;

  cfg.blocks.forEach(block => {
    const blockWidth = xlsxCalcBlockWidth(block);
    maxWidthSeen = Math.max(maxWidthSeen, blockWidth);

    if (block.bayName) {
      sheet.mergeCells(r, 1, r, blockWidth);
      const title = sheet.getCell(r, 1);
      title.value = block.bayName;
      xlsxStyleCell(title, { fill: XLS_COLORS.bayHeader, font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } } });
      r += 1;
    }

    if (block.split) {
      const leftWidth = xlsxRowsWidth(block.left.rows);
      const rightWidth = xlsxRowsWidth(block.right.rows);
      const tlCol = leftWidth + 1;
      const rightStartCol = tlCol + 1;

      const leftEnd = xlsxWriteRows(sheet, block.left.rows, seats, r, 1);
      const rightEnd = xlsxWriteRows(sheet, block.right.rows, seats, r, rightStartCol);
      const blockEnd = Math.max(leftEnd, rightEnd);

      if (block.tlSeat) {
        sheet.mergeCells(r, tlCol, blockEnd - 1, tlCol);
        const tlCell = sheet.getCell(r, tlCol);
        const tlSeat = seats[block.tlSeat];
        tlCell.value = 'TEAM\nLEAD\n' + (tlSeat && tlSeat.occupant ? tlSeat.occupant : 'VACANT');
        xlsxStyleCell(tlCell, { fill: XLS_COLORS.teamLead, font: { bold: true, size: 10 } });
      }
      r = blockEnd;
    } else if (block.leftDoorRows) {
      // Door occupies its own column 1, spanning only the rows it belongs to.
      // The seat grid shifts right by one column to make room for it.
      const doorRows = block.rows.slice(0, block.leftDoorRows);
      const restRows = block.rows.slice(block.leftDoorRows);
      const doorStartRow = r;
      const doorEndRow = xlsxWriteRows(sheet, doorRows, seats, r, 2) - 1;
      sheet.mergeCells(doorStartRow, 1, doorEndRow, 1);
      const doorCell = sheet.getCell(doorStartRow, 1);
      doorCell.value = 'DOOR';
      xlsxStyleCell(doorCell, { fill: XLS_COLORS.door, font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } } });
      r = doorEndRow + 1;
      if (restRows.length) r = xlsxWriteRows(sheet, restRows, seats, r, 2);
    } else if (block.pairedRows) {
      block.pairedRows.forEach(pr => {
        if (pr.leftId) {
          xlsxWriteSeatCellPair(sheet, r, 1, pr.leftId, seats[pr.leftId]);
        } else {
          xlsxEmptySlot(sheet, r, 1);
        }
        const rowEnd = xlsxWriteRows(sheet, [{ prefix: pr.prefix, cells: pr.cells }], seats, r, 2);
        if (pr.rightDoor) {
          const doorCol = 2 + xlsxCellsWidth(pr.cells);
          sheet.mergeCells(r, doorCol, rowEnd - 1, doorCol);
          const doorCell = sheet.getCell(r, doorCol);
          doorCell.value = 'DOOR';
          xlsxStyleCell(doorCell, { fill: XLS_COLORS.door, font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } } });
        }
        r = rowEnd;
      });
    } else {
      r = xlsxWriteRows(sheet, block.rows, seats, r, 1);
    }

    if (block.showDoor || block.showDoorCenter || block.showDoorLeft) {
      const doorCol = block.showDoorCenter
        ? Math.max(1, Math.floor(blockWidth / 2))
        : (block.showDoorLeft ? 1 : Math.max(1, blockWidth - 1));
      xlsxWriteDoorTag(sheet, r, doorCol, 2);
      r += 1;
    }

    r += block.tight ? 0 : 1;
  });

  for (let col = 1; col <= maxWidthSeen; col++) {
    xlsxSetMinColWidth(sheet, col, 13);
  }
  return r;
}

function xlsxWriteTallSeat(sheet, startRow, col, seatId, seat, nameSpan) {
  sheet.mergeCells(startRow, col, startRow + nameSpan - 1, col);
  const nameCell = sheet.getCell(startRow, col);
  nameCell.value = xlsxSeatLabel(seat);
  xlsxStyleCell(nameCell, { fill: xlsxSeatFill(seat), font: { bold: true, size: 10.5 } });

  const idRow = startRow + nameSpan;
  const idCell = sheet.getCell(idRow, col);
  idCell.value = seatId;
  xlsxStyleCell(idCell, { fill: XLS_COLORS.seatId, font: { bold: true, size: 9 } });
}

function xlsxWriteTallSeatWide(sheet, startRow, col, seatId, seat, nameSpan) {
  sheet.mergeCells(startRow, col, startRow + nameSpan - 1, col + 1);
  const nameCell = sheet.getCell(startRow, col);
  nameCell.value = xlsxSeatLabel(seat);
  xlsxStyleCell(nameCell, { fill: xlsxSeatFill(seat), font: { bold: true, size: 10.5 } });

  const idRow = startRow + nameSpan;
  sheet.mergeCells(idRow, col, idRow, col + 1);
  const idCell = sheet.getCell(idRow, col);
  idCell.value = seatId;
  xlsxStyleCell(idCell, { fill: XLS_COLORS.seatId, font: { bold: true, size: 9 } });
}

function xlsxWriteVerticalRoom(sheet, ops, cfg, seats, startRow) {
  const NAME_SPAN = 3;
  const BLOCK_HEIGHT = NAME_SPAN + 1;
  let colCursor = 1;
  let maxRowUsed = startRow;

  cfg.columns.forEach(column => {
    let r = startRow;

    if (column.bayName) {
      sheet.mergeCells(r, colCursor, r, colCursor + 1);
      const title = sheet.getCell(r, colCursor);
      title.value = column.bayName;
      xlsxStyleCell(title, { fill: XLS_COLORS.bayHeader, font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } } });
      r += 1;
    }

    column.pairs.forEach(pair => {
      if (pair.right) {
        xlsxWriteTallSeat(sheet, r, colCursor, pair.left, seats[pair.left], NAME_SPAN);
        xlsxWriteTallSeat(sheet, r, colCursor + 1, pair.right, seats[pair.right], NAME_SPAN);
      } else {
        xlsxWriteTallSeatWide(sheet, r, colCursor, pair.left, seats[pair.left], NAME_SPAN);
      }
      r += BLOCK_HEIGHT;
    });

    if (column.leadSeat) {
      sheet.mergeCells(r, colCursor, r + NAME_SPAN - 1, colCursor + 1);
      const leadCell = sheet.getCell(r, colCursor);
      const leadSeat = seats[column.leadSeat];
      leadCell.value = (column.leadTitle || 'TL SEAT') + '\n' + (leadSeat && leadSeat.occupant ? leadSeat.occupant : 'VACANT');
      xlsxStyleCell(leadCell, { fill: XLS_COLORS.teamLead, font: { bold: true, size: 10.5 } });
      r += NAME_SPAN;

      sheet.mergeCells(r, colCursor, r, colCursor + 1);
      const idCell = sheet.getCell(r, colCursor);
      idCell.value = column.leadSeat;
      xlsxStyleCell(idCell, { fill: XLS_COLORS.seatId, font: { bold: true, size: 9 } });
      r += 1;
    }

    if (column.showDoor) {
      xlsxWriteDoorTag(sheet, r, colCursor, 2);
      r += 1;
    }

    maxRowUsed = Math.max(maxRowUsed, r);
    xlsxSetMinColWidth(sheet, colCursor, 16);
    xlsxSetMinColWidth(sheet, colCursor + 1, 16);
    xlsxSetGapColWidth(sheet, colCursor + 2, 3);
    colCursor += 3;
  });

  return maxRowUsed;
}

function xlsxWriteLegend(sheet, row) {
  const items = [
    ['Occupied', XLS_COLORS.occupied],
    ['Team Lead', XLS_COLORS.teamLead],
    ['Training', XLS_COLORS.training],
    ['Reserved', XLS_COLORS.reserved],
    ['Vacant', XLS_COLORS.vacant]
  ];
  let r = row + 1;
  const titleCell = sheet.getCell(r, 1);
  titleCell.value = 'LEGEND';
  xlsxStyleCell(titleCell, { font: { bold: true, size: 9 }, border: false, align: { horizontal: 'left' } });
  r += 1;
  items.forEach(([label, color]) => {
    const swatch = sheet.getCell(r, 1);
    xlsxStyleCell(swatch, { fill: color, font: { size: 9 } });
    const lbl = sheet.getCell(r, 2);
    lbl.value = label;
    xlsxStyleCell(lbl, { font: { size: 9 }, align: { horizontal: 'left' }, border: false });
    r += 1;
  });
  return r;
}

function xlsxSeatsForRoom(ops) {
  const room = dbState[dbKey(ops)];
  if (room && room.liveSeats) return room.liveSeats;
  return defaultSeatsFor(ops);
}

async function exportToExcel() {
  if (typeof ExcelJS === 'undefined') {
    showWebDialog({
      title: 'Export unavailable',
      message: 'The Excel export library did not load. Check your internet connection and try again.',
      type: 'alert'
    });
    return;
  }

  showNotification('Building the seat plan workbook…', '', false);

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Big Outsource — OPS Room Seat Tracker';
    workbook.created = new Date();

    OPS_LIST.forEach(ops => {
      const seats = xlsxSeatsForRoom(ops);
      const cfg = ROOM_LAYOUTS[ops] || ROOM_LAYOUTS['OPS 1'];
      const sheet = workbook.addWorksheet(ops, { views: [{ showGridLines: false }] });
      sheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0, footer: 0 }
      };

      const gridStartRow = xlsxWriteHeader(sheet, ops, seats);
      let endRow;
      if (cfg.mode === 'grid') {
        endRow = xlsxWriteGridRoom(sheet, ops, cfg, seats, gridStartRow);
      } else if (cfg.type === 'vertical') {
        endRow = xlsxWriteVerticalRoom(sheet, ops, cfg, seats, gridStartRow);
      } else {
        endRow = xlsxWriteWideRoom(sheet, ops, cfg, seats, gridStartRow);
      }
      xlsxWriteLegend(sheet, endRow);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    const siteFileTag = currentSite === 'Candelaria Seat Plan' ? 'Candelaria' : 'HQ';
    a.href = url;
    a.download = siteFileTag + '_Seatplan_Export_' + stamp + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    showNotification('Seat plan exported to Excel ✓', 'success', true);
  } catch (err) {
    console.error(err);
    showNotification('Export failed: ' + err.message, 'warning', true);
  }
}
window.exportToExcel = exportToExcel;

function initSitePicker() {
  const wrap = document.getElementById('sitePillWrap');
  const btn = document.getElementById('sitePillBtn');
  const menu = document.getElementById('sitePillMenu');
  if (!wrap || !btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  menu.querySelectorAll('.site-pill-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const site = opt.getAttribute('data-site');
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      switchSite(site);
    });
  });

  document.addEventListener('click', () => {
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}
initSitePicker();

function initHelpFab() {
  const wrap = document.getElementById('helpFabWrap');
  const btn = document.getElementById('helpFabBtn');
  if (!wrap || !btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  const panel = document.getElementById('helpPanel');
  if (panel) panel.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('click', () => {
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}
initHelpFab();

// ============ Seat Search (by occupant name, across every OPS tab / site) ============
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarPaletteClass(seed) {
  const str = String(seed || '');
  if (!str) return 'acc-palette-1';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return 'acc-palette-' + (Math.abs(hash) % 5 + 1);
}

function highlightMatchText(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return safe;
  const before = escapeHtml(text.slice(0, idx));
  const match = escapeHtml(text.slice(idx, idx + query.length));
  const after = escapeHtml(text.slice(idx + query.length));
  return before + '<mark>' + match + '</mark>' + after;
}

// Searches occupant names across every OPS tab on both sites (not just the
// one currently open), so a name can be found no matter where it's seated.
function searchAllSeats(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];

  SITE_LIST.forEach(site => {
    (SITE_OPS_LISTS[site] || []).forEach(ops => {
      const room = dbState[site + '::' + ops];
      if (!room) return;
      const seats = room.draftSeats ? room.draftSeats : room.liveSeats;
      Object.keys(seats).forEach(seatId => {
        const seat = seats[seatId];
        if (seat && seat.occupant && seat.occupant.trim() !== '' && seat.occupant.toLowerCase().includes(q)) {
          results.push({ site, ops, seatId, occupant: seat.occupant, team: seat.team || '', status: seat.status });
        }
      });
    });
  });

  // Exact / starts-with matches float to the top, then alphabetical.
  results.sort((a, b) => {
    const aStarts = a.occupant.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.occupant.toLowerCase().startsWith(q) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.occupant.localeCompare(b.occupant);
  });

  return results;
}

function highlightSeatInFloor(seatId, attempt = 0) {
  const floor = document.getElementById('floorRoot');
  const el = floor && floor.querySelector('[data-seat-id="' + CSS.escape(seatId) + '"]');
  if (!el) {
    // Render can still be settling right after a tab/site switch — retry briefly.
    if (attempt < 10) setTimeout(() => highlightSeatInFloor(seatId, attempt + 1), 60);
    return;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  el.classList.remove('seat-search-highlight');
  void el.offsetWidth; // restart animation if the same seat is searched twice in a row
  el.classList.add('seat-search-highlight');
  setTimeout(() => el.classList.remove('seat-search-highlight'), 3200);
}

function goToSearchResult(match) {
  const wrap = document.getElementById('seatSearchWrap');
  const input = document.getElementById('seatSearchInput');
  if (wrap) wrap.classList.remove('open');
  if (input) input.value = match.occupant;

  const jumpToOps = () => {
    if (match.ops === currentOps && !viewingSnapshotSeats) {
      highlightSeatInFloor(match.seatId);
    } else {
      viewingSnapshotSeats = null;
      viewingSnapshotVersionId = null;
      switchOps(match.ops, () => highlightSeatInFloor(match.seatId));
    }
  };

  if (match.site !== currentSite) {
    switchSite(match.site);
    // switchSite's own transition is also on a short delay before the floor
    // re-renders, so wait for it to settle before switching OPS + highlighting.
    setTimeout(jumpToOps, 180);
  } else {
    jumpToOps();
  }
}

function renderSearchSuggestions(query) {
  const wrap = document.getElementById('seatSearchWrap');
  const box = document.getElementById('seatSearchSuggestions');
  if (!wrap || !box) return;

  const q = query.trim();
  if (!q) {
    wrap.classList.remove('open');
    box.innerHTML = '';
    return;
  }

  const results = searchAllSeats(q).slice(0, 12);
  wrap.classList.add('open');

  if (results.length === 0) {
    box.innerHTML = '<div class="search-no-results">No occupants matching "' + escapeHtml(q) + '"</div>';
    return;
  }

  box.innerHTML = '';
  results.forEach((match, i) => {
    const item = document.createElement('div');
    item.className = 'search-result-item' + (i === 0 ? ' active' : '');
    const siteTag = match.site === 'Candelaria Seat Plan' ? 'Candelaria' : 'HQ';
    const paletteClass = getAvatarPaletteClass(match.team || match.occupant);
    item.innerHTML =
      '<span class="search-result-avatar ' + paletteClass + '">' + escapeHtml(getInitials(match.occupant)) + '</span>' +
      '<span class="search-result-info">' +
        '<div class="search-result-name">' + highlightMatchText(match.occupant, q) + '</div>' +
        '<div class="search-result-meta">' + escapeHtml(match.team || 'No account') + ' · ' + siteTag + ' · ' + escapeHtml(match.ops) + '</div>' +
      '</span>' +
      '<span class="search-result-seatid">' + escapeHtml(match.seatId) + '</span>';
    item.style.animationDelay = (i * 22) + 'ms';
    item.addEventListener('click', () => goToSearchResult(match));
    box.appendChild(item);
  });
}

function initSeatSearch() {
  const wrap = document.getElementById('seatSearchWrap');
  const input = document.getElementById('seatSearchInput');
  const clearBtn = document.getElementById('seatSearchClear');
  const box = document.getElementById('seatSearchSuggestions');
  if (!wrap || !input || !clearBtn || !box) return;

  let debounceTimer = null;

  input.addEventListener('input', () => {
    wrap.classList.toggle('has-value', input.value.trim() !== '');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderSearchSuggestions(input.value), 120);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim() !== '') renderSearchSuggestions(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = box.querySelector('.search-result-item');
      if (first) first.click();
    } else if (e.key === 'Escape') {
      wrap.classList.remove('open');
      input.blur();
    }
  });

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    wrap.classList.remove('has-value', 'open');
    box.innerHTML = '';
    input.focus();
  });

  wrap.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('click', () => {
    wrap.classList.remove('open');
  });
}
initSeatSearch();

(async function init() {
  await loadDB();
  const sitePillLabel = document.getElementById('sitePillLabel');
  if (sitePillLabel) sitePillLabel.textContent = currentSite;
  document.querySelectorAll('.site-pill-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-site') === currentSite);
  });
  document.getElementById('floorOpsName').textContent = currentOps;
  renderTabs();
  renderStats();
  renderFloatingBar();
  renderFloor();
})();
