import { A, ASSETS, CHAINS, readCore, readEvmPools, addressFootprint, rpc } from './chain.js';
import { api, keeper, esplora, N } from './api.js';
import { esc, int, units, eth, short, ago, link, src, HIDDEN } from './fmt.js';
import { renderBitcoin, lookupBtcTx } from './btc.js';
import { xnsName, xnsResolve, XNS_READY } from './xns.js';
import { decodeTacitAddress } from '../vendor/tacit-address-kit.js';
import { analyze, render as renderLink, forAddress } from './link.js';

const LINK = {};   // chain → analysis
async function linkability() {
  await Promise.all([8453, 1].map(async (chain) => {
    const el = $('link-' + chain);
    el.innerHTML = `<p class="note">Reading ${CHAINS[chain].name} pool logs…</p>`;
    try {
      LINK[chain] = await analyze(chain, (p) => { el.innerHTML = `<p class="note">Reading ${CHAINS[chain].name} pool logs… ${Math.round(p * 100)}%</p>`; });
      el.innerHTML = `<h3>${CHAINS[chain].name} ETH pool</h3>` + renderLink(LINK[chain]);
      headline();
    } catch (e) { el.innerHTML = `<p class="err">Couldn't read ${CHAINS[chain].name} pool logs (${esc(e.message || e)}). Public RPCs cap log queries; reload to retry.</p>`; }
  }));
}

const $ = (id) => document.getElementById(id);
// The page's lead: the most telling fact the linkability check found, in one line.
function headline() {
  const b = LINK[8453], e = LINK[1], el = document.getElementById('headline-t');
  if (!el || (!b && !e)) return;
  const bits = [];
  if (b && b.exits) {
    const top = [...b.recips.values()].sort((x, y) => y - x).slice(0, 3).reduce((t, n) => t + n, 0);
    bits.push(`Base pool, last 6h: <b>${int(b.deposits)}</b> deposits, <b>${int(b.exits)}</b> withdrawals, <b>${int(b.transfers)}</b> private transfers. ${b.recips.size === 1 ? 'Every exit went to <b>a single address</b>.' : b.recips.size <= 3 ? `Every exit went to one of <b>${int(b.recips.size)}</b> addresses.` : `${Math.round((100 * top) / b.exits)}% of exits went to 3 addresses.`}`);
  }
  if (e && e.exits) bits.push(`Ethereum, since launch: <b>${Math.round((100 * e.unique.length) / e.exits)}%</b> of withdrawals match exactly one earlier deposit by amount.`);
  el.innerHTML = bits.join(' ') || 'No withdrawals in the windows read.';
}
const S = {};                 // everything read this round, for cross-checks and the privacy panel
const ETHERSCAN = CHAINS[1].addr, ETX = CHAINS[1].tx;
const MEMPOOL = 'https://mempool.space/tx/', MBLOCK = 'https://mempool.space/block/';
const row = (k, v, s = '', note = '') => `<div class="row"><span class="k">${k}${note ? `<small>${note}</small>` : ''}</span><span class="v num">${v}${s ? ' ' + s : ''}</span></div>`;
const fail = (el, what, e) => { $(el).innerHTML = `<p class="err">Couldn't read ${esc(what)} right now (${esc(e?.message || e)}). Nothing is shown in its place: retrying on the next refresh.</p>`; };
const xnsCache = new Map();
async function nameOf(addr) {
  if (!XNS_READY || !addr) return null;
  const a = addr.toLowerCase();
  if (!xnsCache.has(a)) xnsCache.set(a, xnsName(a).catch(() => null));
  return xnsCache.get(a);
}
async function addrLink(addr, chain = 1) {
  const n = await nameOf(addr);
  return `<a href="${esc(CHAINS[chain].addr + addr)}" target="_blank" rel="noopener noreferrer" title="${esc(addr)}"${n ? ' class="xns"' : ''}>${esc(n || short(addr, 6, 4))}</a><button type="button" class="lk" data-q="${esc(addr)}" title="Look up what's public about ${esc(addr)}">⌕</button>`;
}

// ── pulse: the four heights that say whether the two chains are in step ───────────────────────────────────────
async function pulse() {
  const [btcTip, core, status, relay] = await Promise.allSettled([esplora('/blocks/tip/height', true).then(Number), readCore(), api('/reflection/status?network=mainnet'), api('/confidential/relay')]);
  if (btcTip.status === 'fulfilled') S.btcTip = btcTip.value;
  if (core.status === 'fulfilled') S.core = core.value;
  if (status.status === 'fulfilled') S.status = status.value;
  if (relay.status === 'fulfilled') S.relay = relay.value;
  const c = S.core, st = S.status;
  const cell = (label, value, sub, cls = '') => `<div class="cell ${cls}"><span class="lbl">${label}</span><b>${value}</b><span class="sub">${sub}</span></div>`;
  const relayState = S.relay?.state;
  $('pulse').innerHTML = [
    cell('Bitcoin tip', S.btcTip ? link(MBLOCK + S.btcTip, int(S.btcTip)) : '—', 'mempool.space'),
    cell('Header relay on Ethereum', c ? int(c.relayTip) : '—', c && S.btcTip ? `${S.btcTip - c.relayTip} behind Bitcoin` : 'BitcoinLightRelay.tipHeight()', c && S.btcTip && S.btcTip - c.relayTip > 6 ? 'warn' : ''),
    cell('Proven into the pool', c ? int(c.provenHeight) : '—', c && S.btcTip ? `${S.btcTip - c.provenHeight} blocks · ${st?.confirmations ?? 24} conf. required` : 'attestedReflectionTip()'),
    cell('Relay', relayState ? esc(relayState) : '—', S.relay ? `prover ${S.relay.proving ? 'on' : 'off'} · settling ${S.relay.settling ? 'on' : 'off'}` : '/confidential/relay', relayState === 'ok' || relayState === 'busy' ? 'ok' : relayState ? 'warn' : ''),
  ].join('');
  $('asof').innerHTML = `<span class="live"></span>live${c ? ` · Ethereum block ${int(c.block)}<br>read ${new Date().toLocaleTimeString()}` : ''}`;
}

// ── the map: one note, two chains ───────────────────────────────────────────────────────────────────────────
function map() {
  const c = S.core, st = S.status, f = S.flow?.now;
  const num = (v) => (v == null ? '—' : int(v));
  $('map').innerHTML = `
  <div class="lane btc">
    <h3>Bitcoin <small>Taproot envelopes</small></h3>
    <p>Assets are etched, minted, moved and burned in envelopes inside ordinary Bitcoin transactions.</p>
    <div class="big" id="map-btc">${S.btcSummary || '…'}</div>
  </div>
  <div class="lane bridge">
    <h3>Bridge <small>SP1 proofs</small></h3>
    <div class="arrow">→ Bitcoin burns → proven → minted on Ethereum</div>
    ${row('Burns recorded', num(st?.bridgeBurns), src('api', '/reflection/status bridgeBurns'))}
    ${row('…minted on Ethereum', num(st?.bridgeMinted), src('api', '/reflection/status bridgeMinted'))}
    ${row('In flight', st && st.bridgeBurns != null && st.bridgeMinted != null ? num(st.bridgeBurns - st.bridgeMinted) : '—')}
    <div class="arrow">← Ethereum cross-outs ← proven → re-minted on Bitcoin</div>
    ${row('Cross-outs attested', num(c?.crossOuts), src('chain', 'pool.attestedCrossOutCount()'))}
    ${row('Bitcoin notes consumed', num(c?.consumed), src('chain', 'pool.attestedBitcoinConsumedCount()'))}
  </div>
  <div class="lane evm">
    <h3>Ethereum · Base · Robinhood <small>confidential pools</small></h3>
    <p>The same notes live as commitments in an immutable pool; a second ETH-only pool runs at the same address on Ethereum, Base and Robinhood Chain.</p>
    ${row('V1 pool notes', num(c?.notes), src('chain', 'pool.nextLeafIndex()'))}
    ${row('EVM pool notes, all chains', S.evm ? num(S.evm.filter((p) => p.ok).reduce((s, p) => s + p.notes, 0)) : '—', src('chain', 'TacitEvmPool.nextIndex() on each chain'))}
    ${row('Settles in 24h', Array.isArray(S.flow?.events?.settles) ? num(S.flow.events.settles.length) : '—', src('api', '/flow events'))}
    ${row('Attestations in 24h', Array.isArray(S.flow?.events?.attests) ? num(S.flow.events.attests.length) : '—', src('api', '/flow events'))}
  </div>`;
}

// ── Ethereum / Base side ────────────────────────────────────────────────────────────────────────────────────
async function evmSide() {
  const c = S.core, st = S.stats;
  if (!c) return fail('evm', 'the Ethereum pool', 'RPC unavailable');
  const link_ = st?.link;
  const check = (chainV, apiV) => (apiV == null ? src('chain') : Number(chainV) === Number(apiV) ? src('match', `indexer says ${apiV}`) : Number(chainV) > Number(apiV) ? `${src('chain')} <span class="src" title="The indexer reads on a ~1 minute cache">indexer ${int(apiV)}, a little behind</span>` : src('differ', `indexer says ${apiV}`));
  const btc = st?.btc, tac = st?.tac;
  $('evm-v1').innerHTML = `
    ${row('Notes ever created', int(c.notes), check(c.notes, link_?.notes), 'every output is a new leaf')}
    ${row('Notes spent (nullifiers)', link_?.spent != null ? int(link_.spent) : '—', src('api', 'NullifiersSpent events'), 'can exceed notes created: notes born on Bitcoin and bridged over are spent here too')}
    ${row('Settles', link_?.settles != null ? int(link_.settles) : '—', src('api'), 'transactions that moved notes')}
    ${row('Current note root', `<code title="${esc(c.noteRoot)}">${short(c.noteRoot, 10, 6)}</code>`, src('chain', 'pool.currentRoot()'))}
    ${row('ETH held by the pool', eth(c.poolEth), src('chain', 'eth_getBalance(pool)'), 'the total is public, who owns it is not')}
    ${row('Pool generation', /^0x0{40}$/.test(c.successor) ? 'current (no successor set)' : `retired → ${short(c.successor)}`, src('chain', 'pool.successor()'))}`;
  $('evm-assets').innerHTML = `
    <table><thead><tr><th>Asset</th><th>Public ERC-20 supply</th><th>Inside the pool</th></tr></thead><tbody>
    <tr><td>TAC</td><td class="num">${units(c.tacSupply, 18, 2)} ${src('chain', 'TAC.totalSupply()')}</td><td>${tac?.tacIn ? `${int(tac.tacIn.n)} wraps in · amounts public at entry` : '—'}</td></tr>
    <tr><td>wTAC <small>farm reward</small></td><td class="num">${units(c.wtacSupply, 18, 2)} ${src('chain', 'wTAC.totalSupply()')}</td><td>escrowed for the farms</td></tr>
    <tr><td>cBTC <small>tacBTC</small></td><td class="num">${units(c.tacbtcSupply, 18, 8)} ${src('chain')}</td><td>backing ${int(c.cbtcBackingSats)} sats of real BTC locks ${src('chain', 'pool.cbtcBackingSats()')}${btc ? ` · ${int(btc.nLocked)} live lock${btc.nLocked === 1 ? '' : 's'}` : ''}</td></tr>
    <tr><td>cUSD <small>tacUSD</small></td><td class="num">${units(c.tacusdSupply, 18, 2)} ${src('chain')}</td><td>${units(c.outstandingCusd, 8, 4)} cUSD of CDP debt outstanding ${src('chain', 'CollateralEngine.outstandingCusd()')}${btc ? ` · ${int(btc.open)} open position${btc.open === 1 ? '' : 's'}` : ''}</td></tr>
    </tbody></table>
    <p class="note">The public ERC-20 supply is only what someone has unwrapped. Everything else lives as confidential notes, so the totals above are a floor on what exists, not a ceiling.</p>`;

  // EVM (device) pools on each chain
  const rows = (S.evm || []).map((p) => {
    const ch = CHAINS[p.chain], d = (st?.dev || []).find((x) => x && Number(x.chain) === p.chain);
    if (!p.ok) return `<tr><td>${ch.name}</td><td colspan="4" class="err">RPC unavailable</td></tr>`;
    return `<tr><td>${link(ch.addr + A.evmPool, ch.name)}</td><td class="num">${eth(p.bal)} ETH</td><td class="num">${int(p.notes)}</td>
      <td class="num">${d ? `${int(d.nd)} in · ${int(d.nw)} out` : '—'}</td><td><code title="${esc(p.root)}">${short(p.root, 8, 4)}</code></td></tr>`;
  }).join('');
  $('evm-pools').innerHTML = `<table><thead><tr><th>Chain</th><th>Held ${src('chain')}</th><th>Notes</th><th>Deposits / withdrawals ${src('api')}</th><th>Root</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// The latest V1 pool events, straight from the public index. Each row says what an observer learns from it.
async function evmFeed() {
  try {
    const head = await api('/confidential/index?from=999999999&limit=1', { ttl: 15000 });
    const from = Math.max(0, (head.total || 0) - 40);
    const j = await api(`/confidential/index?from=${from}&limit=40`, { ttl: 15000 });
    S.index = j;
    const byTx = new Map();
    for (const e of j.entries || []) { const g = byTx.get(e.tx) || { tx: e.tx, block: e.block, rows: [] }; g.rows.push(e); byTx.set(e.tx, g); }
    const txs = [...byTx.values()].sort((a, b) => b.block - a.block).slice(0, 14);
    const times = await blockTimes(txs.map((t) => t.block));
    $('evm-feed').innerHTML = `<table class="feed"><thead><tr><th>When</th><th>What happened</th><th>Visible</th><th>Hidden</th><th>Tx</th></tr></thead><tbody>${txs.map((t) => {
      const kinds = t.rows.map((r) => describe(r)).filter(Boolean);
      const vis = t.rows.flatMap((r) => visible(r));
      return `<tr><td>${ago(times.get(t.block))}<br><small>#${int(t.block)}</small></td><td>${kinds.join('<br>')}</td><td>${[...new Set(vis)].join('<br>')}</td><td>${hiddenOf(t.rows)}</td><td>${link(ETX + t.tx, short(t.tx, 8, 4))}</td></tr>`;
    }).join('')}</tbody></table>
    <p class="note">${int(j.total)} index rows through block ${int(j.indexedToBlock)} ${j.synced ? '(synced)' : '(catching up)'} ${src('api', '/confidential/index — a client can rebuild this stream from the pool logs alone')}</p>`;
  } catch (e) { fail('evm-feed', 'the pool event stream', e); }
}
function describe(r) {
  const a = ASSETS[String(r.assetId || '').toLowerCase()];
  if (r.type === 'wrap') return `<b>Wrap</b> ${a ? a.sym : short(r.assetId)} enters the pool`;
  if (r.type === 'leaves') return `<b>${r.leaves.length} note${r.leaves.length === 1 ? '' : 's'}</b> created (leaf ${int(r.first)}${r.leaves.length > 1 ? '–' + int(r.first + r.leaves.length - 1) : ''})`;
  if (r.type === 'nullifiers') return `<b>${r.nullifiers.length} note${r.nullifiers.length === 1 ? '' : 's'}</b> spent`;
  if (r.type === 'crossOut') return `<b>Cross-out</b> to ${r.destChain === 0 || r.destChain === '0' ? 'Bitcoin' : 'chain ' + esc(r.destChain)}`;
  if (r.type === 'locks') return `<b>Stealth lock</b> ${r.lockLeaves?.length || 0} in · ${r.lockNullifiers?.length || 0} out`;
  return esc(r.type);
}
function visible(r) {
  if (r.type === 'wrap') { const a = ASSETS[String(r.assetId).toLowerCase()]; return [`amount <b>${a ? units(BigInt(r.amount), 18, 6) : int(r.amount)} ${a ? a.sym : ''}</b> (entry is public)`]; }
  if (r.type === 'leaves') return ['count, time, fee payer'];
  if (r.type === 'nullifiers') return ['count, time'];
  if (r.type === 'crossOut') return ['destination chain, time'];
  return ['time'];
}
function hiddenOf(rows) {
  const t = new Set(rows.map((r) => r.type));
  const out = [];
  if (t.has('leaves')) out.push(`amount ${HIDDEN}`, `owner ${HIDDEN}`);
  if (t.has('nullifiers')) out.push(`which notes ${HIDDEN}`);
  if (t.has('leaves') && t.has('nullifiers')) out.push(`input↔output link ${HIDDEN}`);
  if (t.has('wrap') && !t.has('leaves')) out.push('nothing yet: the deposit waits to be settled into a note');
  return out.join('<br>') || '—';
}
const blockTimeCache = new Map();
async function blockTimes(blocks) {
  const todo = [...new Set(blocks)].filter((b) => !blockTimeCache.has(b)).slice(0, 20);
  await Promise.all(todo.map(async (b) => { try { const x = await rpc(1, 'eth_getBlockByNumber', ['0x' + b.toString(16), false]); blockTimeCache.set(b, Number(BigInt(x.timestamp))); } catch { /* time unknown */ } }));
  return blockTimeCache;
}

// EVM pool on Base (and Ethereum): the last Transact events, read as logs from the chain itself. The event carries the
// public half of every move (recipient, signed external amount, relayer, fee); the keeper's feed leaves those out.
const TRANSACT = '0xdf0ed29e998ac2f2ff0f0516cb9c1b95af189e00d55af3764b95bdd2a835e53a';
const W = (data, i) => BigInt('0x' + (String(data).slice(2 + i * 64, 2 + i * 64 + 64) || '0'));
const I256 = (w) => (w >> 255n ? w - (1n << 256n) : w);
async function poolLogs(chain, span) {
  // A few blocks behind the head, so an endpoint that is a block or two behind another still serves the range.
  const head = Number(BigInt(await rpc(chain, 'eth_blockNumber', []))) - 3;
  const out = [];
  for (let to = head, tries = 0; out.length < 8 && tries < 10; tries++) {
    const from = Math.max(0, to - span + 1);
    let logs;
    try { logs = await rpc(chain, 'eth_getLogs', [{ address: A.evmPool, topics: [TRANSACT], fromBlock: '0x' + from.toString(16), toBlock: '0x' + to.toString(16) }]); }
    catch (e) { if (e.range && span > 50) { span = Math.max(50, Math.floor(span / 4)); continue; } throw e; }
    out.unshift(...logs);
    to = from - 1;
  }
  return out.slice(-8).reverse().map((l) => {
    const x = I256(W(l.data, 5));
    return { block: Number(BigInt(l.blockNumber)), tx: l.transactionHash, x, recipient: '0x' + String(l.data).slice(2 + 4 * 64 + 24, 2 + 5 * 64), relayer: '0x' + String(l.data).slice(2 + 6 * 64 + 24, 2 + 7 * 64), fee: W(l.data, 7), leaves: [W(l.data, 0), W(l.data, 1)].filter((v) => v !== 0n).length };
  });
}
async function evmPoolFeed(chain, el, span) {
  try {
    const evs = await poolLogs(chain, span);
    if (!evs.length) { $(el).innerHTML = `<p class="note">No ${CHAINS[chain].name} pool activity in the recent blocks read.</p>`; return; }
    const rows = await Promise.all(evs.map(async (e) => {
      const kind = e.x > 0n ? 'Deposit' : e.x < 0n ? 'Withdrawal' : 'Private transfer';
      const vis = [];
      if (e.x !== 0n) vis.push(`amount <b>${eth(e.x < 0n ? -e.x : e.x, 6)} ETH</b>`);
      if (e.x < 0n) vis.push(`to ${await addrLink(e.recipient, chain)}`);
      if (e.fee > 0n) vis.push(`relayer fee ${eth(e.fee, 6)}`);
      if (e.x === 0n) vis.push(`2 nullifiers, ${e.leaves} new ${e.leaves === 1 ? "leaf" : "leaves"}`);
      const hid = e.x === 0n ? `amount ${HIDDEN}<br>sender &amp; receiver ${HIDDEN}` : e.x > 0n ? `which note it became ${HIDDEN}` : `which note paid ${HIDDEN}`;
      return `<tr><td>#${int(e.block)}</td><td>${kind}</td><td>${vis.join(" · ")}</td><td>${hid}</td><td>${link(CHAINS[chain].tx + e.tx, short(e.tx, 8, 4))}</td></tr>`;
    }));
    $(el).innerHTML = `<table class="feed"><thead><tr><th>Block</th><th>Kind</th><th>Visible</th><th>Hidden</th><th>Tx</th></tr></thead><tbody>${rows.join('')}</tbody></table><p class="note">Read from <code>Transact</code> logs ${src('chain')}</p>`;
  } catch (e) { fail(el, `the ${CHAINS[chain].name} pool feed`, e); }
}
const baseFeed = () => evmPoolFeed(8453, 'base-feed', 2000);

// ── the bridge ──────────────────────────────────────────────────────────────────────────────────────────────
async function bridge() {
  const c = S.core, st = S.status, link_ = S.stats?.link;
  const [burndeps] = await Promise.allSettled([api('/reflection/burndep-list?network=mainnet', { ttl: 60000 })]);
  const pending = burndeps.status === 'fulfilled' ? (Array.isArray(burndeps.value) ? burndeps.value : burndeps.value?.burns || burndeps.value?.list || []) : null;
  $('bridge-relay').innerHTML = `
    ${row('Bitcoin tip', S.btcTip ? int(S.btcTip) : '—', src('btc'))}
    ${row('Header relay height', c ? int(c.relayTip) : '—', link_?.tip != null ? (Number(link_.tip) === c?.relayTip ? src('match') : src('differ', `indexer: ${link_.tip}`)) : src('chain'), 'BitcoinLightRelay, full proof-of-work')}
    ${row('Reflection proven to', c ? `${int(c.provenHeight)} <small>${link(MBLOCK + strip0x(c.provenHash, true), short(strip0x(c.provenHash, true), 8, 6))}</small>` : '—', src('chain', 'attestedReflectionTip → blockHeight'))}
    ${row('Reflection status (indexer)', st ? `${int(st.attestedHeight)} / tip ${int(st.tipHeight)} · lag ${int(st.lagBlocks)}` : '—', src('api'))}
    ${row('Latest proven Bitcoin-state root', c ? `<code title="${esc(c.provenRoot)}">${short(c.provenRoot, 12, 8)}</code>` : '—', src('chain', 'pool.attestedReflectionDigest()'))}
    ${row('Latest note root (Ethereum)', c ? `<code title="${esc(c.noteRoot)}">${short(c.noteRoot, 12, 8)}</code>` : '—', src('chain', 'pool.currentRoot()'))}
    ${row('Last attestation', link_?.lastAttest ? `${link(ETX + link_.lastAttest.hash, short(link_.lastAttest.hash, 8, 4))} · ${ago(link_.lastAttest.timeStamp)}` : '—', src('api'))}
    ${row('Attestations so far', link_?.attests != null ? int(link_.attests) : '—', src('api'))}`;
  $('bridge-flow').innerHTML = `
    ${row('Bitcoin → Ethereum: burns recorded', st?.bridgeBurns != null ? int(st.bridgeBurns) : '—', src('api'))}
    ${row('…of which minted on Ethereum', st?.bridgeMinted != null ? int(st.bridgeMinted) : '—', src('api'))}
    ${row('Burn deposits awaiting proof bundle', st?.burnsAwaitingBundle != null ? `${int(st.burnsAwaitingBundle)}${st.oldestAwaitingHeight ? ` · oldest at ${int(st.oldestAwaitingHeight)}` : ''}` : '—', src('api'))}
    ${row('Burn deposits tracked', st?.burnDeposits != null ? int(st.burnDeposits) : '—', src('api'))}
    ${row('Ethereum → Bitcoin: cross-outs recorded', c ? int(c.crossOuts) : '—', src('chain', 'pool.attestedCrossOutCount()'))}
    ${row('…folded into the Bitcoin-side reflection', st?.foldedCrossoutCount != null ? int(st.foldedCrossoutCount) : '—', src('api', '/reflection/status foldedCrossoutCount: re-minted or awaiting re-mint on Bitcoin'))}
    ${row('Bitcoin notes consumed by Ethereum', c ? int(c.consumed) : '—', st?.consumedCount != null ? (Number(st.consumedCount) === c?.consumed ? src('match') : src('differ', `indexer: ${st.consumedCount}`)) : src('chain'))}
    ${pending ? row('Burns with a registered proof bundle', int(pending.length), src('api', '/reflection/burndep-list')) : ''}`;
}
const strip0x = (h, reverse = false) => { let s = String(h || '').replace(/^0x/, ''); if (reverse) s = s.match(/../g)?.reverse().join('') || s; return s; };

// ── privacy boundary ────────────────────────────────────────────────────────────────────────────────────────
function privacy() {
  const st = S.stats, c = S.core;
  const n = (v) => (v == null ? '—' : int(v));
  $('privacy').innerHTML = `
  <table class="pv"><thead><tr><th>Where</th><th>Anyone can see</th><th>Stays hidden</th><th>Live evidence</th></tr></thead><tbody>
    <tr><td>Entering the pool (wrap / deposit)</td><td>sender address, asset, <b>exact amount</b>, time, gas</td><td>which note it becomes once settled</td><td>${n(st?.eth?.deposits)} ETH wraps from ${n(st?.eth?.wallets)} wallets on Ethereum ${src('api')}</td></tr>
    <tr><td>Inside the pool (transfer / swap)</td><td>that a settle happened, how many notes in &amp; out, time, the relayer that sent it, its fee</td><td>amounts, owners, <b>which input paid which output</b></td><td>${n(c?.notes)} notes created, ${n(st?.link?.spent)} spent ${src('chain')}</td></tr>
    <tr><td>Leaving the pool (unwrap / withdraw)</td><td>recipient address, <b>exact amount</b>, time</td><td>which note was spent, who owned it</td><td>${st?.tac?.tacOut ? `${n(st.tac.tacOut.n)} TAC exits to ${n(st.tac.tacOut.who)} addresses` : '—'} ${src('api')}</td></tr>
    <tr><td>Bitcoin envelopes</td><td>that a Tacit envelope is in the transaction, its kind (etch / mint / transfer / burn), public asset metadata, fees, inputs &amp; outputs</td><td>confidential amounts (Bulletproofs-committed), who received a silent payment</td><td id="pv-btc">${S.btcPrivacy || '—'}</td></tr>
    <tr><td>The bridge</td><td>burn and mint counts, proof timing, cross-out destination chain</td><td>the note's amount and owner</td><td>${n(S.status?.bridgeBurns)} burns · ${n(c?.crossOuts)} cross-outs</td></tr>
    <tr><td>The relay (a trust note)</td><td colspan="2">Tacit's relay proves a relayed op, so <b>it</b> sees that op's inputs↔outputs and, for a swap, its amounts. Proving on your own device keeps that link off every server. ${link('https://github.com/src-company/tacit/blob/main/docs/BUILD-A-TACIT-DAPP.md#6-relay-api', 'Tacit docs §6')}</td><td>relay: ${esc(S.relay?.state || '—')}</td></tr>
  </tbody></table>
  <p class="note">Timing is the leak that is left: a deposit of 0.37 ETH followed a minute later by a withdrawal of 0.37 ETH links itself, whatever the pool hides. The anonymity set is the number of notes that could have been spent: ${n(c?.notes)} on the V1 pool today.</p>`;
}

// ── look up ─────────────────────────────────────────────────────────────────────────────────────────────────
async function lookup(q) {
  const out = $('lookup-out');
  q = q.trim();
  if (!q) return;
  out.innerHTML = '<p class="note">Reading…</p>';
  try {
    if (/^tacit1/i.test(q)) {
      const d = decodeTacitAddress(q.toLowerCase());
      const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
      out.innerHTML = `<div class="card">
        ${row('Type', 'Tacit address (bech32m)')}
        ${row('Network', esc(d.network))}
        ${row('Lanes', Object.keys(d.lanes).map((k) => ({ btc: 'Bitcoin (silent payments)', evm: 'Ethereum key', pool: 'EVM pool' }[k] || k)).join(' · '))}
        ${d.lanes.btc ? row('Bitcoin spend key', `<code>${short(hex(d.lanes.btc.spendPub), 10, 8)}</code>`) : ''}
        ${d.lanes.btc ? row('Bitcoin scan key', `<code>${short(hex(d.lanes.btc.scanPub), 10, 8)}</code>`) : ''}
        ${d.lanes.pool?.poolAddress ? row('Pool address', `<code>${short(d.lanes.pool.poolAddress, 12, 8)}</code>`) : ''}
        <p class="pvbox"><b>What's public about it:</b> nothing on any chain. A tacit1 ID is a bundle of receive keys. Payments to it are silent payments (BIP-352) on Bitcoin and note commitments on Ethereum, so no transaction ever contains this string or anything an observer can match to it. Sharing it links your own lanes to each other for whoever you give it to, and that's all.</p></div>`;
    } else if (/^[0-9a-f]{64}$/i.test(q.replace(/^0x/, '')) && !/^0x/.test(q)) {
      out.innerHTML = await lookupBtcTx(q.toLowerCase());
    } else if (/^0x[0-9a-f]{64}$/i.test(q)) {
      const r = await rpc(1, 'eth_getTransactionReceipt', [q]);
      if (!r) { out.innerHTML = await lookupBtcTx(q.slice(2).toLowerCase()); return; }
      const touches = r.logs.filter((l) => [A.pool, A.relayer, A.router].map((x) => x.toLowerCase()).includes(l.address.toLowerCase()));
      out.innerHTML = `<div class="card">${row('Ethereum transaction', link(ETX + q, short(q, 10, 6)))}${row('From', await addrLink(r.from))}${row('Block', int(Number(BigInt(r.blockNumber))))}${row('Tacit pool logs', int(touches.length))}
        <p class="pvbox">${touches.length ? 'This touched the confidential pool. Public: who sent it, when, gas, and how many notes went in and out. Hidden: amounts and owners of the notes.' : 'No Tacit pool events in this transaction.'}</p></div>`;
    } else {
      let addr = q;
      if (!/^0x[0-9a-f]{40}$/i.test(q)) {
        addr = XNS_READY ? await xnsResolve(q) : null;
        if (!addr) { out.innerHTML = `<p class="err">Not a tacit1 ID, Bitcoin txid, EVM address or a known XNS name.</p>`; return; }
      }
      const [fp, name, pts] = await Promise.all([addressFootprint(addr), nameOf(addr), api(`/points/${addr.toLowerCase()}`).catch(() => null)]);
      out.innerHTML = `<div class="card">
        ${row('Address', `${link(ETHERSCAN + addr, addr)}${name ? ` · <b class="xns">${esc(name)}</b>` : ''}`)}
        ${Object.entries(fp.chains).map(([c, v]) => row(CHAINS[c].name, v.err ? 'unavailable' : `${eth(v.bal)} ETH · ${int(v.nonce)} txs sent${v.contract ? ' · contract' : ''}`, src('chain'))).join('')}
        ${fp.tokens ? row('Public Tacit tokens (Ethereum)', fp.tokens.map((t) => `${units(t.bal, 18, 4)} ${t.sym}`).join(' · '), src('chain')) : ''}
        ${pts ? row('Tacit points', `${int(pts.points ?? pts.total ?? 0)}`, src('api', '/points/:address — the points program is public by design')) : ''}
        ${(() => {
          const mine = forAddress(Object.values(LINK), addr);
          if (!Object.keys(LINK).length) return row('Pool withdrawals to it', 'the linkability check is still reading');
          if (!mine.length) return row('Pool withdrawals to it', `none in the windows read (${Object.values(LINK).map((r) => `${CHAINS[r.chain].name}: ${r.chain === 1 ? 'since launch' : 'last 6h'}`).join(', ')})`, src('chain'));
          const shown = mine.slice(-8).reverse(), uniq = mine.filter((m) => m.cands.length === 1).length;
          return row('Pool withdrawals to it', `${int(mine.length)} in the windows read · ${int(uniq)} matching exactly one deposit by amount`, src('chain')) + shown.map((m) => row(`Withdrawal on ${CHAINS[m.chain].name}`, `${link(CHAINS[m.chain].tx + m.e.tx, short(m.e.tx, 6, 4))} · ${eth(m.out, 6)} ETH · ${m.cands.length === 1 ? '<b class="err">one earlier deposit has this exact amount</b>' : `${int(m.cands.length)} earlier deposits share this amount`}`, src('chain'))).join('') + (mine.length > shown.length ? row('', `latest ${shown.length} shown`) : '');
        })()}
        <p class="pvbox"><b>What's public:</b> this address's balances, every transaction it sent, and any wrap into or exit from a Tacit pool it made, amount included. <b>What isn't:</b> any confidential note it holds or has held. Nothing on chain links an address to notes inside the pool. The link only appears if the same amount goes in and comes out close together.</p></div>`;
    }
  } catch (e) { out.innerHTML = `<p class="err">${esc(e.message || e)}</p>`; }
}

// ── run ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Every source is asked at once and each section draws as soon as what it needs is in, so a slow endpoint holds up
// only its own panel.
async function round() {
  const redraw = () => { try { map(); privacy(); } catch { /* drawn on the next one */ } };
  const statsP = api('/stats?view=front', { ttl: 55000 }).then((v) => { S.stats = v; }).catch(() => {});
  const flowP = api('/flow', { ttl: 55000 }).then((v) => { S.flow = v; }).catch(() => {});
  const evmP = readEvmPools().then((v) => { S.evm = v; }).catch(() => {});
  const pulseP = pulse().catch((e) => fail('pulse', 'chain heights', e));
  const btcP = renderBitcoin(S).catch(() => {});
  evmFeed();
  baseFeed();
  [statsP, flowP, evmP, pulseP, btcP].forEach((p) => p.then(redraw));
  await Promise.allSettled([pulseP, statsP]);
  bridge().catch((e) => fail('bridge-relay', 'the bridge', e));
  await evmP;
  await evmSide().catch((e) => fail('evm-v1', 'the Ethereum pool', e));
  await Promise.allSettled([flowP, btcP]);
  redraw();
}

document.addEventListener('click', (e) => { const b = e.target.closest('.lk'); if (!b) return; $('q').value = b.dataset.q; $('lookup-form').requestSubmit(); $('look').scrollIntoView({ behavior: 'smooth' }); });
$('lookup-form').addEventListener('submit', (e) => { e.preventDefault(); const q = $('q').value; history.replaceState(null, '', '#q=' + encodeURIComponent(q)); lookup(q); });
document.querySelectorAll('[data-try]').forEach((b) => b.addEventListener('click', () => { $('q').value = b.dataset.try; $('lookup-form').requestSubmit(); }));
const m = location.hash.match(/^#q=(.+)$/);
if (m) { $('q').value = decodeURIComponent(m[1]); lookup($('q').value); }
// On phones the tables stack; each cell keeps its column name as a label.
const label = () => document.querySelectorAll('table').forEach((t) => {
  const h = [...t.querySelectorAll('thead th')].map((th) => th.textContent.replace(/\s+(chain|indexer)$/, '').trim());
  if (h.length) t.querySelectorAll('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => { if (!td.dataset.label && h[i]) td.dataset.label = h[i]; }));
});
new MutationObserver(label).observe(document.body, { childList: true, subtree: true });
round();
linkability();
setInterval(round, 60000);
