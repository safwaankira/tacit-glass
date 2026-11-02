# tacit glass

One page that shows what's happening on [Tacit](https://tacit.finance), across both chains: Bitcoin envelopes, the confidential pools on Ethereum, Base and Robinhood Chain, the SP1 bridge between them, and an honest line between what an observer can see and what stays hidden.

Entry for poidh bounty 1519, "Vibecode a Tacit Explorer".

## What's on the page

- **Pulse.** Bitcoin tip, header-relay height on Ethereum, the height reflection has proven into the pool, and the relay's state.
- **One note, two chains.** Bitcoin, the bridge and the EVM pools side by side, with live counts for each.
- **Bitcoin side.** Live envelope feed (etches, mints, confidential transfers, burns), the asset registry with impostor-ticker warnings, and the Bitcoin-native tETH/TAC AMM pool.
- **Ethereum / Base side.** The V1 ConfidentialPool (notes, nullifiers, roots, ETH held), cBTC / cUSD / TAC / wTAC, the ETH pool on every chain, and the latest pool events on Ethereum and Base.
- **The bridge.** Header relay vs Bitcoin tip, the latest proven Bitcoin-state root and note root, burns recorded and minted, burns awaiting proof bundles, cross-outs.
- **Privacy boundary.** For each kind of action: what anyone can see, what stays hidden, with live evidence. Every feed row says what it revealed and what it didn't.
- **Linkability check.** Reads the ETH pool's `Transact` logs and measures how many withdrawals match exactly one earlier deposit by amount — the most common way pool privacy fails in practice.
- **Look up your footprint.** Paste a `tacit1…` ID, a Bitcoin txid, an EVM address or tx, or an XNS name (`name@xns`) and see what's public about it.
- **XNS.** EVM addresses show as XNS names where one exists, resolved on chain from the registry at `0x6e797ba2d3103aF167918e71a7E01DE40D45f74b`; search by name works too.

## Where every number comes from

Each figure carries a tag:

| tag | meaning |
|---|---|
| `chain` | your browser read it from a public Ethereum / Base / Robinhood node (publicnode, drpc, base.org) |
| `bitcoin` | mempool.space / blockstream |
| `indexer` | Tacit's public API, `api.tacit.finance` |
| `tacitscan` | tacitscan.io's indexer |
| `chain ✓ indexer` | read both ways, and they agree |
| `chain ≠ indexer` | they disagree (usually the indexer's 60-second cache); the chain value is the one to trust |

Real mainnet data only, no mocks, no snapshots. Tacit's `/assets` and `/amm/*` routes and tacitscan's API don't send CORS headers to other sites, so this site forwards those GETs through a plain pass-through rewrite (`vercel.json` / `_redirects`): `/tapi/*` → `api.tacit.finance`, `/tscan/*` → `tacitscan.io/api`. Nothing is stored or changed in transit.

No wallet, no sign-in, no keys, nothing written to any chain.

## Run it

It's static: plain ES modules, no build step.

```
npx vercel dev        # or any static server; the /tapi and /tscan rewrites need Vercel or Netlify
python3 test/run.py   # headless check against recorded API samples
```

## Built on

Tacit's own MIT-licensed code: the token palette of `docs/dapp-template`, the addresses and selectors of `dapp/weld/stats/read.js`, and `dapp/kit/tacit-address-kit.js` (vendored unmodified for tacit1 decoding). See `vendor/TACIT-LICENSE`.
