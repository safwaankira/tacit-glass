// The Bitcoin side. Envelopes are read from tacitscan's indexer (its /api/feed, through this site's proxy) and from
// Tacit's own indexer (/assets, /amm/pools); the Bitcoin tip and transactions from mempool.space.
import { api, scan, esplora } from './api.js';
import { esc, int, units, short, ago, link, src, HIDDEN } from './fmt.js';

const $ = (id) => document.getElementById(id);
const MEMPOOL = 'https://mempool.space/tx/';
const TSCAN = 'https://tacitscan.io/tx/';
export const TAC_ID = 'f0bbe868af10c6c67652a99709bf32048d1aa7194efe3e9a1ef1bde43f94762b';
export const TETH_ID = '3cba71e1114af183cdeacc6b8457a474d17529fd28704480ca799d0d03126f34';
export const AMM_POOL = 'aa3eab26215844c32ba27ed51413c48f881b4c605a233a5ccd169517bf33eb79';

// What each envelope kind is, and what it puts in public view.
const KIND = [
  [/^T_(C|P)?ETCH$/, 'etch', 'asset id, ticker, decimals, issuer\'s output', 'supply (a commitment, unless the issuer discloses it)'],
  [/^T_(P|SLOT_)?MINT$|^T_DROP$|^T_DCLAIM$/, 'mint', 'asset, time, outputs', 'amount per recipient'],
  [/^T_(C|A)XFER/, 'transfer', 'asset (for some kinds), count of outputs, fee', 'amounts (Bulletproofs range-proved commitments), who received'],
  [/^T_SLOT_(SPLIT|MERGE|ROTATE)$/, 'transfer', 'that a note was split / merged / rotated', 'amounts'],
  [/BRIDGE_BURN$|^T_BURN$|^T_SLOT_BURN$/, 'burn', 'asset, burned amount, time', 'the note it came from'],
  [/^T_(LP_|SWAP)/, 'amm', 'pool, reserves after the op', 'who traded (for routed swaps)'],
  [/^T_BRIDGE|^T_DEPOSIT$|^T_WITHDRAW$/, 'bridge', 'that a note crossed, its timing', 'amount and owner of the note'],
  [/^T_CBTC|^T_CTAC/, 'cbtc', 'the BTC lock output and its sats', 'which note was minted against it'],
  [/^T_BTC_/, 'pool', 'shield / call timing', 'amounts inside the BTC pool'],
];
export const kindOf = (op0) => { const op = op0 && !/^T_/.test(op0) && op0 !== 'UNKNOWN' ? 'T_' + op0 : op0; for (const [re, k, v, h] of KIND) if (re.test(op || '')) return { k, v, h }; return { k: (op || 'unknown').replace(/^T_/, '').toLowerCase(), v: 'that an envelope is there', h: '—' }; };

export async function renderBitcoin(S) {
  const [feed, assets, amm] = await Promise.allSettled([scan('/feed'), api('/assets?network=mainnet', { ttl: 120000 }), api('/amm/pools?network=mainnet', { ttl: 60000 })]);
  // ── envelope feed ──
  const rows = [];
  let stale = 0;
  if (feed.status === 'fulfilled') {
    for (const r of feed.value.rows || []) {
      const t = r.blockTime ? Date.parse(r.blockTime) || Number(r.blockTime) : Date.parse(r.firstSeenAt);
      // tacitscan keeps a mempool row until it confirms; one seen hours ago that never confirmed was dropped. Shown here only
      // while it is fresh, and counted, so a dropped transaction never reads as live activity.
      if (r.chainStatus === 'mempool' && Date.now() - Date.parse(r.firstSeenAt) > 3 * 3600e3) { stale++; continue; }
      rows.push({ txid: r.txid, op: r.opcode, ticker: r.displayName || r.ticker, assetId: r.assetId, height: r.blockHeight, t, pending: r.chainStatus === 'mempool', from: 'scan' });
    }
  }
  // Etches and burns Tacit's indexer has dated, so the feed is never empty when tacitscan is.
  if (assets.status === 'fulfilled') {
    for (const a of assets.value.assets || []) {
      rows.push({ txid: a.etch_txid, op: 'T_CETCH', ticker: a.ticker, assetId: a.asset_id, height: a.etched_at_height, t: a.etched_at * 1000, from: 'api' });
      for (const b of a.burns || []) rows.push({ txid: b.burn_txid, op: 'T_BURN', ticker: a.ticker, assetId: a.asset_id, height: b.burned_at_height, t: b.burned_at * 1000, amount: b.burned_amount, dec: a.decimals, from: 'api' });
    }
  }
  const seen = new Set();
  const list = rows.filter((r) => r.txid && !seen.has(r.txid) && seen.add(r.txid)).sort((a, b) => (b.pending - a.pending) || (b.t - a.t)).slice(0, 18);
  if (list.length) {
    $('btc-feed').innerHTML = `<table class="feed"><thead><tr><th>When</th><th>Envelope</th><th>Asset</th><th>Public</th><th>Hidden</th></tr></thead><tbody>${list.map((r) => {
      const k = kindOf(r.op);
      return `<tr><td>${r.pending ? '<b>mempool</b>' : ago(r.t)}<br><small>${r.height ? '#' + int(r.height) : ''}</small></td>
        <td><span class="kind">${esc(k.k)}</span><br>${link(MEMPOOL + r.txid, short(r.txid, 6, 4))} <small>${esc(r.op || '')}</small></td>
        <td>${esc(r.ticker || '—')}${r.assetId === TAC_ID ? ' <small>✓ TAC</small>' : ''}</td>
        <td>${r.amount ? `burned <b>${units(r.amount, r.dec ?? 8, 4)}</b>` : esc(k.v)}</td><td>${k.h === '—' ? '—' : `${esc(k.h)} ${HIDDEN}`}</td></tr>`;
    }).join('')}</tbody></table>
    <p class="note">${feed.status === 'fulfilled' ? `Live from tacitscan's indexer ${src('scan')}` : 'tacitscan unavailable, '} with etches and burns from Tacit's indexer ${src('api')}.${stale ? ` ${int(stale)} mempool entr${stale === 1 ? 'y' : 'ies'} tacitscan still lists from hours ago (never confirmed) are left out.` : ''}</p>`;
  } else $('btc-feed').innerHTML = `<p class="err">Couldn't read envelope activity right now.</p>`;

  // ── assets ──
  if (assets.status === 'fulfilled') {
    const all = assets.value.assets || [];
    const tickers = new Map();
    for (const a of all) tickers.set(a.ticker, (tickers.get(a.ticker) || 0) + 1);
    const top = [...all].sort((a, b) => (b.holder_count - a.holder_count) || (b.transfer_count - a.transfer_count)).slice(0, 10);
    const transfers = all.reduce((s, a) => s + (a.transfer_count || 0), 0);
    S.btcAssets = { count: all.length, transfers, tac: all.find((a) => a.asset_id === TAC_ID) };
    $('btc-assets').innerHTML = `<table><thead><tr><th>Asset</th><th>Holders</th><th>Transfers</th><th>Supply</th></tr></thead><tbody>${top.map((a) => `
      <tr><td>${link('https://tacitscan.io/assets/' + a.asset_id, a.ticker)}${a.verified ? ' <small>verified</small>' : tickers.get(a.ticker) > 1 ? ' <small class="err" title="Another asset uses the same ticker: check the id">same ticker as another</small>' : ''}<br><small><code>${short(a.asset_id, 8, 6)}</code></small></td>
      <td class="num">${int(a.holder_count)}</td><td class="num">${int(a.transfer_count)}</td>
      <td>${a.attestation?.supply ? `${units(a.attestation.supply, a.decimals, 2)} <small>disclosed</small>` : `${HIDDEN}`}</td></tr>`).join('')}</tbody></table>
      <p class="note">${int(all.length)} assets etched, ${int(transfers)} confidential transfers in all ${src('api', 'api.tacit.finance /assets')}. Anyone can etch any ticker, so ${int([...tickers.values()].filter((n) => n > 1).length)} tickers are shared by more than one asset: the asset id is what's real.</p>`;
  } else $('btc-assets').innerHTML = `<p class="err">Couldn't read the asset registry (${esc(assets.reason?.message)}).</p>`;

  // ── AMM ──
  if (amm.status === 'fulfilled') {
    const p = (amm.value.pools || []).find((x) => x.pool_id === AMM_POOL) || (amm.value.pools || [])[0];
    if (p) {
      const ra = BigInt(p.reserve_a), rb = BigInt(p.reserve_b);
      const price = ra > 0n ? Number(rb) / Number(ra) : null;
      S.amm = p;
      $('btc-amm').innerHTML = `
        <div class="row"><span class="k">Reserves</span><span class="v num"><b>${units(ra, 8, 6)}</b> tETH · <b>${units(rb, 8, 4)}</b> TAC ${src('api')}</span></div>
        <div class="row"><span class="k">Implied price</span><span class="v num">${price ? `1 tETH = ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })} TAC` : '—'}</span></div>
        <div class="row"><span class="k">LP shares</span><span class="v num">${int(p.lp_total_shares)} <small>(${int(p.locked_shares)} locked forever)</small></span></div>
        <div class="row"><span class="k">Fee</span><span class="v num">${(p.fee_bps / 100).toFixed(2)}%</span></div>
        <div class="row"><span class="k">Founded</span><span class="v">${link(MEMPOOL + p.init_txid, short(p.init_txid, 6, 4))} at #${int(p.init_height)}</span></div>
        <div class="row"><span class="k">Last swap</span><span class="v">${p.last_swap_txid ? `${link(MEMPOOL + p.last_swap_txid, short(p.last_swap_txid, 6, 4))} · ${ago(p.last_swap_at)}` : 'none yet'}</span></div>
        <div class="row"><span class="k">Validation</span><span class="v">${esc(p.validation || '—')}</span></div>
        <p class="note">An AMM can't hide its reserves: every swap moves them in public, so the pool's price and depth are visible to all. Who swapped stays private.</p>`;
    } else $('btc-amm').innerHTML = '<p class="note">No Bitcoin AMM pool listed.</p>';
  } else $('btc-amm').innerHTML = `<p class="err">Couldn't read the Bitcoin AMM (${esc(amm.reason?.message)}).</p>`;

  const tac = S.btcAssets?.tac;
  S.btcSummary = `
    <div class="row"><span class="k">Assets etched</span><span class="v num"><b>${S.btcAssets ? int(S.btcAssets.count) : '—'}</b></span></div>
    <div class="row"><span class="k">Confidential transfers</span><span class="v num"><b>${S.btcAssets ? int(S.btcAssets.transfers) : '—'}</b></span></div>
    <div class="row"><span class="k">TAC holders on Bitcoin</span><span class="v num"><b>${tac ? int(tac.holder_count) : '—'}</b></span></div>
    <div class="row"><span class="k">AMM tETH / TAC</span><span class="v num">${S.amm ? `${units(BigInt(S.amm.reserve_a), 8, 5)} / ${units(BigInt(S.amm.reserve_b), 8, 3)}` : '—'}</span></div>`;
  S.btcPrivacy = S.btcAssets ? `${int(S.btcAssets.transfers)} transfers, amounts hidden in every one ${src('api')}` : '—';
}

// A Bitcoin transaction: what mempool.space shows anyone, and whether it carries a Tacit envelope.
export async function lookupBtcTx(txid) {
  const [tx, found] = await Promise.allSettled([esplora('/tx/' + txid), scan('/search?q=' + txid)]);
  if (tx.status !== 'fulfilled') return `<p class="err">No Bitcoin transaction ${esc(short(txid, 10, 6))} found on mempool.space.</p>`;
  const t = tx.value;
  const isTacit = found.status === 'fulfilled' && (found.value.txids || []).some((x) => (x.txid || x) === txid);
  const meta = isTacit ? (found.value.txids || []).find((x) => (x.txid || x) === txid) : null;
  const k = meta?.opcode ? kindOf(meta.opcode) : null;
  const outSats = t.vout.reduce((s, o) => s + o.value, 0);
  return `<div class="card">
    <div class="row"><span class="k">Bitcoin transaction</span><span class="v">${link(MEMPOOL + txid, short(txid, 10, 6))} · ${link(TSCAN + txid, 'tacitscan')}</span></div>
    <div class="row"><span class="k">Status</span><span class="v">${t.status?.confirmed ? `confirmed in #${int(t.status.block_height)} · ${ago(t.status.block_time)}` : 'in the mempool'}</span></div>
    <div class="row"><span class="k">Inputs / outputs</span><span class="v num">${t.vin.length} / ${t.vout.length} · ${int(outSats)} sats out · fee ${int(t.fee)} sats</span></div>
    <div class="row"><span class="k">Tacit envelope</span><span class="v">${isTacit ? `yes${meta?.opcode ? ` · <span class="kind">${esc(k.k)}</span> <small>${esc(meta.opcode)}</small>` : ''}` : 'none that tacitscan has indexed'}</span></div>
    <p class="pvbox"><b>What's public:</b> every input and output address, the sats each carries, the fee and the time${isTacit ? ', and that this transaction carries a Tacit envelope' + (k ? ` (${esc(k.v)})` : '') : ''}. ${isTacit && k ? `<b>What isn't:</b> ${esc(k.h)}.` : ''} The sats on a Tacit note's output are dust that says nothing about the asset amount it carries.</p></div>`;
}
