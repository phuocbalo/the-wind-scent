// Save system (N03 saving, N04 backup, N05 save upgrades).
// Data stays on the device only (N12). Stored in IndexedDB, with a copy in
// localStorage as a fallback in case one of them is cleared or blocked.

export const SAVE_VERSION = 1;
const DB_NAME = 'the-wind-scent';
const STORE = 'saves';
const KEY = 'main';
const LS_KEY = 'the-wind-scent:save';

export function newSave(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    savedAt: now,
    gameNow: now,
    testCounter: 0, // Sprint 0 test value
  };
}

// ---- Save upgrades (N05) ----
// Each step upgrades a save from version N to N+1. When the save format
// changes, add a new step here and bump SAVE_VERSION. Never edit old steps.
export const MIGRATIONS = {
  // Version 0 = early test saves without a version number.
  0: (s) => ({ ...newSave(s.savedAt || Date.now()), ...s, version: 1 }),
};

export function migrate(save) {
  if (!save || typeof save !== 'object') throw new Error('invalid-save');
  let s = { ...save };
  let v = typeof s.version === 'number' ? s.version : 0;
  if (v > SAVE_VERSION) throw new Error('save-too-new');
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error('no-migration-' + v);
    s = step(s);
    v = s.version;
  }
  return s;
}

export function validate(save) {
  return !!save && typeof save === 'object'
    && typeof save.version === 'number'
    && typeof save.gameNow === 'number'
    && typeof save.testCounter === 'number';
}

// ---- Storage ----
function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) return reject(new Error('no-indexeddb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function idbPut(value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbClear() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function lsGet() {
  try { const t = localStorage.getItem(LS_KEY); return t ? JSON.parse(t) : null; } catch { return null; }
}
function lsPut(v) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)); return true; } catch { return false; }
}

// Load the newest valid save from either store. Returns null if none.
export async function loadSave() {
  let a = null, b = lsGet();
  try { a = await idbGet(); } catch { a = null; }
  const candidates = [a, b].filter(Boolean).map((s) => { try { return migrate(s); } catch { return null; } }).filter(validate);
  if (!candidates.length) return null;
  candidates.sort((x, y) => (y.savedAt || 0) - (x.savedAt || 0));
  return candidates[0];
}

// Write to both stores. Retries up to 3 times (N03).
// Returns { ok, idb, ls }. If ok is false the game should suggest exporting.
export async function writeSave(save, { retries = 3, wait = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const data = { ...save, version: SAVE_VERSION, savedAt: Date.now() };
  let idb = false;
  for (let i = 0; i < retries && !idb; i++) {
    try { await idbPut(data); idb = true; } catch { await wait(300 * (i + 1)); }
  }
  const ls = lsPut(data);
  return { ok: idb || ls, idb, ls, data };
}

export async function deleteAllData() {
  try { await idbClear(); } catch {}
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// Ask the browser not to clear our data when space is low.
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch {}
  return false;
}

// ---- Backup (N04) ----
export function exportText(save) {
  return JSON.stringify({ game: 'the-wind-scent', exportedAt: Date.now(), save }, null, 2);
}

export function importText(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('not-json'); }
  if (!parsed || parsed.game !== 'the-wind-scent' || !parsed.save) throw new Error('not-our-file');
  const s = migrate(parsed.save);
  if (!validate(s)) throw new Error('invalid-save');
  return s;
}
