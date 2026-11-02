// How much does the pool actually hide? A shielded pool hides which note paid which output, but an amount that goes in
// and the same amount that comes out are public on both ends. This reads the EVM pool's Transact logs straight from the
// chain and measures how many withdrawals an observer could tie to a deposit by amount alone. A heuristic, stated as one:
// a match is a candidate, not proof, and an exit with no unique match is not proof of privacy either.
import { A, CHAINS, rpc } from './chain.js';
import { int, eth, link, short, ago } from './fmt.js';

const TRANSACT = '0xdf0ed29e998ac2f2ff0f0516cb9c1b95af189e00d55af3764b95bdd2a835e53a';
const W = (d, i) => BigInt('0x' + (String(d).slice(2 + i * 64, 2 + i * 64 + 64) || '0'));
const I256 = (w) => (w >> 255n ? w - (1n << 256n) : w);
export const WINDOWS = {
  1: { from: 26069245, label: 'since launch' },             // the pool's deploy block on Ethereum
  8453: { blocks: 10800, label: 'last 6 hours' },            // ~2s blocks; Base runs thousands of moves a day
};

async function logs(chain, from, to, onProgress) {
  const out = [];
  let span = chain === 1 ? 50000 : 10000;
  for (let lo = from; lo <= to;) {
    const hi = Math.min(to, lo + span - 1);
    try {
      const ls = await rpc(chain, 'eth_getLogs', [{ address: A.evmPool, topics: [TRANSACT], fromBlock: '0x' + lo.toString(16), toBlock: '0x' + hi.toString(16) }]);
      out.push(...ls);
      lo = hi + 1;
      onProgress?.((lo - from) / (to - from + 1));
    } catch (e) {
      if (span <= 500) throw e;
      span = Math.floor(span / 4);                               // the endpoint capped the range or the result size
    }
  }
  return out;
}

export async function analyze(chain, onProgress) {
  const head = Number(BigInt(await rpc(chain, 'eth_blockNumber', [])));
  const w = WINDOWS[chain];
  const from = w.from ?? head - w.blocks;
  const raw = await logs(chain, from, head, onProgress);
  const ev = raw.map((l) => ({
    block: Number(BigInt(l.blockNumber)), i: Number(BigInt(l.logIndex)), tx: l.transactionHash,
    x: I256(W(l.data, 5)), fee: W(l.data, 7), to: '0x' + String(l.data).slice(2 + 4 * 64 + 24, 2 + 5 * 64),
  })).sort((a, b) => a.block - b.block || a.i - b.i);
  const deposits = ev.filter((e) => e.x > 0n), exits = ev.filter((e) => e.x < 0n), transfers = ev.filter((e) => e.x === 0n);
  // For each exit: earlier deposits of exactly the amount it took out, or of that amount plus the fee it paid
  // (a note's whole value comes out as amount + fee).
  const byAmt = new Map();
  let di = 0;
  const results = [];
  for (const e of exits) {
    while (di < deposits.length && (deposits[di].block < e.block || (deposits[di].block === e.block && deposits[di].i < e.i))) {
      const d = deposits[di++]; const k = d.x.toString(); (byAmt.get(k) || byAmt.set(k, []).get(k)).push(d);
    }
    const out = -e.x;
    const cands = [...(byAmt.get(out.toString()) || []), ...(e.fee > 0n ? byAmt.get((out + e.fee).toString()) || [] : [])];
    results.push({ e, out, cands });
  }
  const unique = results.filter((r) => r.cands.length === 1);
  const none = results.filter((r) => r.cands.length === 0);
  const sets = results.map((r) => r.cands.length).sort((a, b) => a - b);
  const median = sets.length ? sets[Math.floor(sets.length / 2)] : null;
  const amounts = new Map();
  for (const d of deposits) amounts.set(d.x.toString(), (amounts.get(d.x.toString()) || 0) + 1);
  const topAmt = [...amounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const recips = new Map();
  for (const e of exits) recips.set(e.to.toLowerCase(), (recips.get(e.to.toLowerCase()) || 0) + 1);
  return { chain, from, head, events: ev.length, deposits: deposits.length, exits: exits.length, transfers: transfers.length, unique, none, results, median, topAmt, distinctAmounts: amounts.size, recips };
}

export function render(r, times) {
  const ch = CHAINS[r.chain];
  const pct = (n) => (r.exits ? `${Math.round((100 * n) / r.exits)}%` : '—');
  const examples = r.unique.slice(-4).reverse().map((u) => {
    const d = u.cands[0];
    return `<tr><td>${link(ch.tx + d.tx, short(d.tx, 6, 4))}<br><small>#${int(d.block)}</small></td><td class="num">${eth(d.x, 6)} ETH</td>
      <td>${link(ch.tx + u.e.tx, short(u.e.tx, 6, 4))}<br><small>#${int(u.e.block)} · ${int(u.e.block - d.block)} blocks later</small></td><td>${link(ch.addr + u.e.to, short(u.e.to, 6, 4))}</td></tr>`;
  }).join('');
  return `
    <div class="row"><span class="k">Window</span><span class="v">${ch.name}, ${WINDOWS[r.chain].label} (blocks ${int(r.from)}–${int(r.head)})</span></div>
    <div class="row"><span class="k">Pool events read</span><span class="v num">${int(r.events)}: ${int(r.deposits)} deposits · ${int(r.transfers)} private transfers · ${int(r.exits)} withdrawals</span></div>
    <div class="row"><span class="k">Withdrawals matching <b>exactly one</b> earlier deposit by amount</span><span class="v num"><b>${int(r.unique.length)}</b> (${pct(r.unique.length)})</span></div>
    <div class="row"><span class="k">Withdrawals matching no deposit amount</span><span class="v num">${int(r.none.length)} (${pct(r.none.length)}) <small>split, merged or paid privately first</small></span></div>
    <div class="row"><span class="k">Median same-amount crowd per withdrawal</span><span class="v num">${r.median ?? '—'}</span></div>
    <div class="row"><span class="k">Distinct deposit amounts</span><span class="v num">${int(r.distinctAmounts)}${r.topAmt ? ` · most common ${eth(BigInt(r.topAmt[0]), 6)} ETH × ${int(r.topAmt[1])}` : ''}</span></div>
    ${examples ? `<table class="feed" style="margin-top:8px"><thead><tr><th>Deposit</th><th>Amount</th><th>Withdrawal with the same amount</th><th>Paid to</th></tr></thead><tbody>${examples}</tbody></table>` : ''}
    <p class="note">A unique match is a candidate link, not proof: the same amount can come from two people. And no match isn't proof of privacy: timing and gas habits leak too. Use a common amount, wait, and split before exiting.</p>`;
}

// One address: its withdrawals in the windows read, each with the size of its same-amount crowd.
export function forAddress(analyses, addr) {
  const a = addr.toLowerCase();
  const rows = [];
  for (const r of analyses) for (const x of r.results) if (x.e.to.toLowerCase() === a) rows.push({ chain: r.chain, ...x });
  return rows;
}
