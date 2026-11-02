// Tacit's public APIs. Routes Tacit opens to every origin (OPEN_ORIGIN_PATHS in worker/src/index.js) are called
// directly; the rest go through this site's own pass-through proxy (/tapi/* → api.tacit.finance, /tscan/* →
// tacitscan.io), which forwards the request unchanged and adds nothing. No key, no wallet, nothing written.

export const API = 'https://api.tacit.finance';
const OPEN = new Set(['/stats', '/flow', '/relay/economics', '/confidential/index', '/confidential/relay', '/confidential/open',
  '/confidential/quote', '/confidential/status', '/reflection/status', '/reflection/live', '/reflection/burndep-list', '/crossout/minted',
  '/farm/program', '/farm/health', '/prover/board', '/outpoints/classify']);

const cache = new Map();
export async function api(path, { ttl = 20000, init } = {}) {
  const key = path + (init ? JSON.stringify(init) : '');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.v;
  const pathname = path.split('?')[0];
  const urls = OPEN.has(pathname) ? [API + path, '/tapi' + path] : ['/tapi' + path, API + path];
  let last;
  for (const u of urls) {
    try {
      const r = await fetch(u, { ...init, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`${r.status} ${pathname}`);
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('json')) throw new Error(`not json from ${pathname}`);
      const v = await r.json();
      cache.set(key, { at: Date.now(), v });
      return v;
    } catch (e) { last = e; }
  }
  throw last;
}

// tacitscan.io's own JSON API, through the proxy (it is another origin's site).
export async function scan(path, opts = {}) {
  const r = await fetch('/tscan' + path, { signal: AbortSignal.timeout(20000), ...opts });
  if (!r.ok) throw new Error(`tacitscan ${r.status}`);
  return r.json();
}

export const KEEPER = (chain) => `https://tacit-evm-pool-keepers.onrender.com/${chain}/evm-pool/keeper`;
export async function keeper(chain, path) {
  const urls = [KEEPER(chain) + path, `/tkeep/${chain}` + path];
  let last;
  for (const u of urls) {
    try { const r = await fetch(u, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); } catch (e) { last = e; }
  }
  throw last;
}

export const ESPLORA = ['https://mempool.space/api', 'https://blockstream.info/api'];
export async function esplora(path, text = false) {
  let last;
  for (const b of ESPLORA) {
    try { const r = await fetch(b + path, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(String(r.status)); return text ? r.text() : r.json(); } catch (e) { last = e; }
  }
  throw last;
}

// /stats amounts come as { $n: "…" }.
export const N = (v) => (v == null ? null : typeof v === 'object' && v.$n != null ? BigInt(v.$n) : typeof v === 'bigint' ? v : BigInt(v));
