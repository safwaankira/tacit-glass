export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const int = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('en-US'));

// A bigint amount with `dec` decimals, shown with at most `dp` places, trailing zeros dropped.
export function units(v, dec = 18, dp = 4) {
  if (v == null) return '—';
  const b = BigInt(v), neg = b < 0n, a = neg ? -b : b, base = 10n ** BigInt(dec);
  const whole = a / base;
  const frac = (a % base).toString().padStart(dec, '0').slice(0, dp).replace(/0+$/, '');
  if (whole === 0n && !frac && a > 0n) return (neg ? '-' : '') + '<0.' + '0'.repeat(dp - 1) + '1';
  const w = whole.toLocaleString('en-US');
  return (neg ? '-' : '') + (frac ? `${w}.${frac}` : w);
}
export const eth = (wei, dp = 4) => units(wei, 18, dp);
export const sats = (s) => (s == null ? '—' : `${int(s)} sats`);

export const short = (h, a = 6, b = 4) => { const s = String(h || ''); return s.length > a + b + 3 ? `${s.slice(0, a)}…${s.slice(-b)}` : s; };

export function ago(t) {
  if (!t) return '—';
  const ms = t > 1e11 ? t : t * 1000;
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 84600) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
export const link = (href, text, cls = '') => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${cls}"` : ''}>${esc(text)}</a>`;

// Where a figure came from: "chain" = this browser read it from a public node; "api" = Tacit's indexer said so;
// "both ✓" = both agree; "differ" = they disagree (shown, never hidden).
export function src(kind, title = '') {
  const label = { chain: 'chain', api: 'indexer', match: 'chain ✓ indexer', differ: 'chain ≠ indexer', btc: 'bitcoin', scan: 'tacitscan' }[kind] || kind;
  return `<span class="src src-${kind}" title="${esc(title)}">${label}</span>`;
}
export const HIDDEN = '<span class="hid" title="A Pedersen commitment or encrypted memo: on chain, but unreadable without the key">withheld</span>';
