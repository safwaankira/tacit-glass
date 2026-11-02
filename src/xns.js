// XNS names, resolved on chain: the registry has no HTTP API, so the browser asks an Ethereum node directly.
// Registry 0x6e797ba2d3103aF167918e71a7E01DE40D45f74b (Ethereum mainnet):
//   getName(address) → string   (0x5fd4b08a)   reverse, "" when none
//   getAddress(string) → address (0xbf40fac1)  forward, "label@namespace", zero address when unregistered
import { calls, word } from './chain.js';

export const XNS = '0x6e797ba2d3103aF167918e71a7E01DE40D45f74b';
export const XNS_READY = true;
const NAME_RE = /^[a-z0-9](?:[a-z0-9]|-(?!-)){0,19}@[a-z0-9](?:[a-z0-9]|-(?!-)){0,19}$/;

function decodeString(hex) {
  const h = String(hex || '').replace(/^0x/, '');
  if (h.length < 128) return '';
  const off = parseInt(h.slice(0, 64), 16) * 2, len = parseInt(h.slice(off, off + 64), 16);
  const bytes = h.slice(off + 64, off + 64 + len * 2).match(/../g) || [];
  return new TextDecoder().decode(Uint8Array.from(bytes, (b) => parseInt(b, 16)));
}
function encodeString(s) {
  const b = Array.from(new TextEncoder().encode(s), (x) => x.toString(16).padStart(2, '0')).join('');
  return word('20') + word(s.length.toString(16)) + b.padEnd(Math.ceil(b.length / 64) * 64 || 64, '0');
}

// Reverse names for many addresses in one batch (names are cached per page load).
const cache = new Map();
let queue = null;
export function xnsName(addr) {
  const a = addr.toLowerCase();
  if (cache.has(a)) return cache.get(a);
  if (!queue) {
    queue = new Map();
    setTimeout(async () => {
      const q = queue; queue = null;
      const list = [...q.keys()];
      try {
        const res = await calls(1, list.map((x) => [XNS, '0x5fd4b08a' + word(x.replace(/^0x/, ''))]));
        list.forEach((x, i) => q.get(x).resolve(decodeString(res[i]) || null));
      } catch { list.forEach((x) => q.get(x).resolve(null)); }
    }, 30);
  }
  let resolve;
  const p = new Promise((r) => { resolve = r; });
  queue.set(a, { resolve });
  cache.set(a, p);
  return p;
}

export async function xnsResolve(name) {
  let n = String(name).trim().toLowerCase();
  if (!n.includes('@')) n += '@xns';
  if (!NAME_RE.test(n)) return null;
  const [r] = await calls(1, [[XNS, '0xbf40fac1' + encodeString(n)]]);
  const a = '0x' + String(r).replace(/^0x/, '').slice(24, 64);
  return /^0x0{40}$/.test(a) ? null : a;
}
