import { loadText, applyText, t } from './i18n.js';
import { loadConfig, cfg } from './config.js';
import { GameClock } from './clock.js';
import {
  SAVE_VERSION, newSave, loadSave, writeSave, deleteAllData,
  requestPersistence, exportText, importText,
} from './save.js';

export const APP_VERSION = '0.1.0';

const $ = (id) => document.getElementById(id);
let save;
let clock;
let dirty = false;

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2500);
}

const hhmm = (ms) => new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const full = (ms) => new Date(ms).toLocaleString('vi-VN');

function periodOf(ms) {
  const h = new Date(ms).getHours();
  const p = cfg('clock.periods');
  if (h >= p.night.startHour || h < p.morning.startHour) return 'night';
  if (h >= p.evening.startHour) return 'evening';
  if (h >= p.afternoon.startHour) return 'afternoon';
  return 'morning';
}

// ---- Saving (N03) ----
async function saveNow() {
  save.gameNow = clock.tick();
  $('saveState').textContent = t('save.saving');
  const r = await writeSave(save, { retries: cfg('save.writeRetries') });
  if (r.ok) {
    save = r.data;
    dirty = false;
    $('saveState').textContent = t('save.lastSaved', { time: full(save.savedAt) });
  } else {
    $('saveState').textContent = t('save.failed');
    toast(t('save.failed'));
  }
  return r.ok;
}

// Call after every important action.
function changed() {
  dirty = true;
  render();
  saveNow();
}

function render() {
  $('counter').textContent = String(save.testCounter);
}

function renderClock() {
  const g = clock.tick();
  $('gameTime').textContent = hhmm(g);
  $('period').textContent = t('clock.period', { period: t('clock.' + periodOf(g)) });
  const dbg = $('debug');
  if (dbg) {
    $('dbgDevice').textContent = t('debug.device', { time: full(Date.now()) });
    $('dbgGame').textContent = t('debug.game', { time: full(g) });
  }
}

function renderNet() {
  $('net').textContent = navigator.onLine ? t('status.online') : t('status.offline');
  $('net').classList.toggle('off', !navigator.onLine);
}

// ---- Install (N02) ----
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function setupInstall() {
  if (isStandalone()) { $('installed').hidden = false; return; }
  if (isIOS()) {
    $('iosInstall').hidden = false;
    $('iosInstall').onclick = () => $('iosGuide').showModal();
  }
  let deferred;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    $('install').hidden = false;
  });
  $('install').onclick = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    $('install').hidden = true;
  };
  window.addEventListener('appinstalled', () => {
    $('install').hidden = true;
    $('installed').hidden = false;
  });
  document.querySelectorAll('dialog [data-close]').forEach((b) => { b.onclick = () => b.closest('dialog').close(); });
}

// ---- Offline (N01) ----
function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w && w.addEventListener('statechange', () => {
        if (w.state === 'installed') {
          toast(navigator.serviceWorker.controller ? t('status.updateReady') : t('status.offlineReady'));
        }
      });
    });
  }).catch(() => {});
}

// ---- Backup (N04) ----
function setupBackup() {
  $('export').onclick = async () => {
    await saveNow();
    const blob = new Blob([exportText(save)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `the-wind-scent-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  $('import').onchange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let incoming;
    try { incoming = importText(await file.text()); } catch { toast(t('save.importFailed')); return; }
    if (!confirm(t('save.importConfirm'))) return;
    save = incoming;
    clock = new GameClock({ savedGameNow: save.gameNow });
    render();
    await saveNow();
    toast(t('save.imported'));
  };
  $('delete').onclick = async () => {
    if (!confirm(t('save.deleteConfirm'))) return;
    await deleteAllData();
    save = newSave();
    clock = new GameClock({ savedGameNow: save.gameNow });
    render();
    await saveNow();
    toast(t('save.deleted'));
  };
}

async function start() {
  await Promise.all([loadText('vi'), loadConfig()]);
  applyText();

  save = (await loadSave()) || newSave();
  clock = new GameClock({ savedGameNow: save.gameNow });
  $('clockWarn').hidden = !clock.clockWentBack;

  render();
  renderNet();
  renderClock();
  await saveNow();

  $('add').onclick = () => { save.testCounter += 1; changed(); };
  $('reset').onclick = () => { save.testCounter = 0; changed(); };

  setupBackup();
  setupInstall();
  setupServiceWorker();

  requestPersistence().then((ok) => { $('persist').textContent = ok ? t('save.persisted') : t('save.notPersisted'); });

  if ($('debug')) {
    $('dbgVersion').textContent = t('debug.version', { version: APP_VERSION });
    $('dbgSave').textContent = t('debug.saveVersion', { version: SAVE_VERSION });
  }

  window.addEventListener('online', renderNet);
  window.addEventListener('offline', renderNet);
  setInterval(renderClock, 1000);
  setInterval(() => { saveNow(); }, cfg('save.autoSaveSeconds') * 1000);

  // Save when leaving or switching away (N03).
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
  window.addEventListener('pagehide', () => { saveNow(); });
}

start();
