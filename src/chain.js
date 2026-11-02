// Direct chain reads: every figure marked "chain" on the page is read by the visitor's own browser from a public RPC,
// not from Tacit's servers. Addresses and selectors are the ones in Tacit's docs/DEPLOYMENTS.md and dapp/weld/stats/read.js.

export const A = {
  pool: '0x000000000Ed1eabD231Be41d93b719056F7febFC',
  engine: '0x000000003f608BDdF0ca45934003ffb9DbDF70DB',
  relay: '0x20A6ddc2C6E620c6248B5A34E85996516FDd19D0',
  router: '0x000000005dA3E3B73726af3c774Deeb9472D4992',
  relayer: '0x000000009C28617AC88B52Eae5EFaAcdD4aC34c3',
  tac: '0xA1313eb9f3A445606D9583bcAc3ebeB56a858279',
  wtac: '0x2018139a8FDd3666855BE3315C7683b4D6aB7AEf',
  tacbtc: '0xdf1d99148bEb7a9AFf1d95C49B3d22b7ed90D696',
  tacusd: '0x23cACFFAc2674514A6d4F6cD420B4cc2aC921564',
  farm: '0x000031C47Cb61faB1CE2790a69625FABB71EDE24',
  evmPool: '0x000000c2A20657CE25f2Ba99737933D031AFBEE9',
  evmRouter: '0x0000006C96Afa6f1cD4DF8FE19bc0d8B6A6Cd7B5',
  multisig: '0x006CD14F36F65eCbB29b2519cCBe63A0DC8549F2',
};

export const ASSETS = {
  '0x3cba71e1114af183cdeacc6b8457a474d17529fd28704480ca799d0d03126f34': { sym: 'cETH', dec: 18 },
  '0x62a20d98fc1cd20289621d1315294cb8772f934d822e404b71e1f471cf0679c8': { sym: 'cBTC', dec: 18 },
  '0x8f4490dd3728b0ee904d7a67c11b37ffd463a5c7f08b79810006995ee8a9679d': { sym: 'cUSD', dec: 18 },
  '0xf0bbe868af10c6c67652a99709bf32048d1aa7194efe3e9a1ef1bde43f94762b': { sym: 'TAC', dec: 18 },
  '0x1097c9e552ae4fce2a8c416b93403953fa445a5f2cdae8ced36d9a78cfe40832': { sym: 'wTAC', dec: 18 },
};

export const SEL = {
  tipHeight: '0x1fd4827a',            // BitcoinLightRelay.tipHeight()
  blockHeight: '0x59a53331',          // BitcoinLightRelay.blockHeight(bytes32)
  anchorTip: '0x89fa7909',
  reflTip: '0x182f6171',              // pool.attestedReflectionTip()  → the Bitcoin block reflection has proven up to
  reflDigest: '0xb909cdaf',           // pool.attestedReflectionDigest() → the latest proven Bitcoin-state root
  crossOuts: '0xa6f8c9d6',            // pool.attestedCrossOutCount()
  consumed: '0x281d8cc9',             // pool.attestedBitcoinConsumedCount()
  nextLeaf: '0x0be4f422',             // pool.nextLeafIndex()
  currentRoot: '0xfdab463d',          // pool.currentRoot()
  successor: '0x6ff968c3',            // pool.successor()
  cbtcBacking: '0x9f5b61d9',          // pool.cbtcBackingSats()
  totalSupply: '0x18160ddd',
  outstandingCusd: '0xa42542c0',      // engine.outstandingCusd()
  evmRoot: '0xebf0c717',              // TacitEvmPool.root()
  evmNext: '0xfc7e9c6f',              // TacitEvmPool.nextIndex()
};

export const CHAINS = {
  1: { name: 'Ethereum', short: 'ETH', rpc: ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org', 'https://mainnet.gateway.tenderly.co'], tx: 'https://etherscan.io/tx/', addr: 'https://etherscan.io/address/' },
  8453: { name: 'Base', short: 'BASE', rpc: ['https://base-rpc.publicnode.com', 'https://mainnet.base.org', 'https://base.gateway.tenderly.co'], tx: 'https://basescan.org/tx/', addr: 'https://basescan.org/address/' },
  4663: { name: 'Robinhood Chain', short: 'RH', rpc: ['https://rpc.mainnet.chain.robinhood.com'], tx: 'https://explorer.chain.robinhood.com/tx/', addr: 'https://explorer.chain.robinhood.com/address/' },
};

const strip = (h) => String(h || '').replace(/^0x/, '');
export const word = (h) => strip(h).padStart(64, '0');
export const big = (h) => (h && h !== '0x' ? BigInt(h) : 0n);

let rpcId = 1;
export async function rpc(chain, method, params) {
  let last;
  for (const url of CHAINS[chain].rpc) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: rpcId++, method, params }), signal: AbortSignal.timeout(12000) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message || 'rpc error');
      return j.result;
    } catch (e) { last = e; }
  }
  throw last || new Error('no rpc');
}

// Several eth_calls at one block in one JSON-RPC batch; falls back to one call at a time on endpoints that refuse batches.
export async function calls(chain, list, block = 'latest') {
  for (const url of CHAINS[chain].rpc) {
    try {
      const body = list.map(([to, data], i) => ({ jsonrpc: '2.0', id: i, method: 'eth_call', params: [{ to, data }, block] }));
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      if (!Array.isArray(j)) throw new Error('no batch');
      const by = new Map(j.map((x) => [x.id, x]));
      return list.map((_, i) => { const x = by.get(i); if (!x || x.error) throw new Error('call failed'); return x.result; });
    } catch { /* next endpoint */ }
  }
  const out = [];
  for (const [to, data] of list) out.push(await rpc(chain, 'eth_call', [{ to, data }, block]));
  return out;
}

export async function readCore() {
  const head = Number(BigInt(await rpc(1, 'eth_blockNumber', [])));
  const block = '0x' + head.toString(16);
  const [arr, poolEth] = await Promise.all([
    calls(1, [
      [A.relay, SEL.tipHeight], [A.pool, SEL.reflTip], [A.pool, SEL.reflDigest], [A.pool, SEL.crossOuts], [A.pool, SEL.consumed],
      [A.pool, SEL.nextLeaf], [A.pool, SEL.currentRoot], [A.pool, SEL.successor], [A.pool, SEL.cbtcBacking],
      [A.tac, SEL.totalSupply], [A.wtac, SEL.totalSupply], [A.tacbtc, SEL.totalSupply], [A.tacusd, SEL.totalSupply], [A.engine, SEL.outstandingCusd],
    ], block),
    rpc(1, 'eth_getBalance', [A.pool, block]),
  ]);
  const [tip, reflTip, reflDigest, crossOuts, consumed, nextLeaf, root, successor, backing, tacSupply, wtacSupply, tacbtc, tacusd, outCusd] = arr;
  const [provenHeight] = await calls(1, [[A.relay, SEL.blockHeight + word(reflTip)]], block);
  return {
    block: head,
    relayTip: Number(big(tip)),
    provenHeight: Number(big(provenHeight)), provenHash: reflTip, provenRoot: reflDigest,
    crossOuts: Number(big(crossOuts)), consumed: Number(big(consumed)),
    notes: Number(big(nextLeaf)), noteRoot: root,
    successor: '0x' + strip(successor).slice(24),
    cbtcBackingSats: big(backing),
    tacSupply: big(tacSupply), wtacSupply: big(wtacSupply), tacbtcSupply: big(tacbtc), tacusdSupply: big(tacusd), outstandingCusd: big(outCusd),
    poolEth: big(poolEth),
  };
}

export async function readEvmPools() {
  return Promise.all(Object.keys(CHAINS).map(async (c) => {
    const chain = Number(c);
    try {
      const [bal, [root, next], head] = await Promise.all([
        rpc(chain, 'eth_getBalance', [A.evmPool, 'latest']),
        calls(chain, [[A.evmPool, SEL.evmRoot], [A.evmPool, SEL.evmNext]]),
        rpc(chain, 'eth_blockNumber', []),
      ]);
      return { chain, ok: true, bal: big(bal), root, notes: Number(big(next)), block: Number(BigInt(head)) };
    } catch (e) { return { chain, ok: false, err: String(e.message || e) }; }
  }));
}

// Public footprint of an EVM address: what any observer can read with a node and nothing else.
export async function addressFootprint(addr) {
  const a = addr.toLowerCase();
  const out = { addr, chains: {} };
  await Promise.all(Object.keys(CHAINS).map(async (c) => {
    const chain = Number(c);
    try {
      const [bal, nonce, code] = await Promise.all([
        rpc(chain, 'eth_getBalance', [a, 'latest']), rpc(chain, 'eth_getTransactionCount', [a, 'latest']), rpc(chain, 'eth_getCode', [a, 'latest']),
      ]);
      out.chains[chain] = { bal: big(bal), nonce: Number(big(nonce)), contract: code && code !== '0x' };
    } catch (e) { out.chains[chain] = { err: String(e.message || e) }; }
  }));
  // Public ERC-20 balances of the Tacit tokens on Ethereum (balanceOf(address) = 0x70a08231).
  try {
    const toks = [['TAC', A.tac], ['wTAC', A.wtac], ['tacBTC', A.tacbtc], ['tacUSD', A.tacusd]];
    const r = await calls(1, toks.map(([, t]) => [t, '0x70a08231' + word(a)]));
    out.tokens = toks.map(([s], i) => ({ sym: s, bal: big(r[i]) }));
  } catch { out.tokens = null; }
  return out;
}
