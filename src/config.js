// Config table loader. Every balance number lives in data/config.json, so
// tuning never needs a code change.

let config = null;

export async function loadConfig() {
  const res = await fetch('data/config.json');
  config = await res.json();
  return config;
}

export function cfg(path) {
  const v = path.split('.').reduce((o, k) => (o ? o[k] : undefined), config);
  if (v === undefined) throw new Error('missing config: ' + path);
  return v;
}
