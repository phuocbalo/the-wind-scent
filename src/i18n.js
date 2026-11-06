// Text loader (N11). All player-facing text lives in text/<lang>.json.
// Never write Vietnamese text directly in code; add a key to text/vi.json.

let strings = {};

export async function loadText(lang = 'vi') {
  const res = await fetch(`text/${lang}.json`);
  strings = await res.json();
  document.documentElement.lang = lang;
  return strings;
}

// t('save.ok') or t('clock.time', { time: '08:00' })
export function t(key, vars = {}) {
  const value = key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), strings);
  if (typeof value !== 'string') return `[${key}]`;
  return value.replace(/\{(\w+)\}/g, (_, v) => (vars[v] != null ? vars[v] : `{${v}}`));
}

// Fill every element that has data-t="key".
export function applyText(root = document) {
  root.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  root.querySelectorAll('[data-t-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
}
