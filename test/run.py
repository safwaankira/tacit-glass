"""Load the page in headless Chrome with every network call answered from fixtures (real samples taken from the
live APIs on 2026-11-02, plus a fake but well-formed JSON-RPC). Catches runtime errors and empty sections; it does
not check live numbers, which the deployed page reads for itself."""
import json, os, re, sys, threading, http.server, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FX = os.path.join(ROOT, 'test', 'fx')
fx = lambda n: open(os.path.join(FX, n)).read()

def w(n): return format(n % (1 << 256), '064x')
def h32(s): return (s * 64)[:64]

def call(data):
    sel = data[:10]
    tbl = {
        '0x1fd4827a': w(974229), '0x182f6171': h32('ab'), '0xb909cdaf': h32('cd'), '0xa6f8c9d6': w(9), '0x281d8cc9': w(2),
        '0x0be4f422': w(5358), '0xfdab463d': h32('ef'), '0x6ff968c3': w(0), '0x9f5b61d9': w(4800),
        '0x18160ddd': w(2_500_000 * 10**18), '0xa42542c0': w(49815650), '0x59a53331': w(974207),
        '0xebf0c717': h32('12'), '0xfc7e9c6f': w(158134), '0x70a08231': w(5 * 10**18),
    }
    if sel == '0x5fd4b08a':   # getName
        name = b'ross@wei'
        return '0x' + w(32) + w(len(name)) + name.hex().ljust(64, '0')
    if sel == '0xbf40fac1':
        return '0x' + w(0x1C0Aa8cCD568d90d61659F060D1bFb1e6f855A20)
    return '0x' + tbl.get(sel, w(0))

def logs():
    out = []
    amts = [10**16, 2 * 10**16, 10**16, 3 * 10**15]
    for i in range(30):
        x = amts[i % 4] if i % 3 == 0 else (-(amts[(i - 1) % 4]) if i % 3 == 1 else 0)
        data = '0x' + w(1) + w(2) + w(i * 2) + w(0xabc) + w(0x1C0Aa8cCD568d90d61659F060D1bFb1e6f855A20) + w(x) + w(0xdead) + w(10**12) + w(320) + w(352) + w(0) + w(0)
        out.append({'blockNumber': hex(52_900_000 + i * 10), 'logIndex': hex(i), 'transactionHash': '0x' + format(i, '064x'), 'data': data, 'topics': []})
    return out

def rpc(req):
    m, p = req['method'], req.get('params', [])
    if m == 'eth_blockNumber': r = hex(52_900_400)
    elif m == 'eth_call': r = call(p[0]['data'])
    elif m == 'eth_getBalance': r = hex(123 * 10**16)
    elif m == 'eth_getTransactionCount': r = hex(7)
    elif m == 'eth_getCode': r = '0x'
    elif m == 'eth_getLogs': r = logs()
    elif m == 'eth_getBlockByNumber': r = {'timestamp': hex(1793630000)}
    elif m == 'eth_getTransactionReceipt': r = {'from': '0x' + '11' * 20, 'blockNumber': hex(26000000), 'logs': []}
    else: r = None
    return {'jsonrpc': '2.0', 'id': req.get('id'), 'result': r}

def stats():
    return json.dumps({
        'at': 1793630000000, 'block': 26328260,
        'eth': {'inWei': {'$n': str(5 * 10**18)}, 'held': {'$n': str(3 * 10**18)}, 'outWei': {'$n': '0'}, 'deposits': 3234, 'wallets': 812, 'unread': 0, 'lastAt': 1793630000, 'series': {'ins': []}},
        'dev': [{'chain': 1, 'nd': 300, 'nw': 120, 'bal': {'$n': '1'}}, {'chain': 8453, 'nd': 60000, 'nw': 19000, 'bal': {'$n': '1'}}, {'chain': 4663, 'nd': 3, 'nw': 1, 'bal': {'$n': '1'}}],
        'btc': {'nLocked': 1, 'open': 2},
        'tac': {'tacIn': {'n': 140, 'v': {'$n': '1'}}, 'tacOut': {'n': 220, 'v': {'$n': '1'}, 'who': 160}},
        'link': {'tip': 974229, 'notes': 5358, 'spent': 5516, 'settles': 4100, 'attests': 310, 'lastAttest': {'hash': '0x' + 'aa' * 32, 'timeStamp': 1793629000}},
    })

def handle(route):
    u = route.request.url
    def j(body, status=200): route.fulfill(status=status, content_type='application/json', body=body if isinstance(body, str) else json.dumps(body), headers={'access-control-allow-origin': '*'})
    if 'localhost:8765' in u and '/tapi/' not in u and '/tscan/' not in u: return route.continue_()
    if route.request.method == 'POST' and route.request.post_data and '"jsonrpc"' in route.request.post_data:
        body = json.loads(route.request.post_data)
        return j([rpc(x) for x in body] if isinstance(body, list) else rpc(body))
    if '/blocks/tip/height' in u: return route.fulfill(status=200, body='974231', headers={'access-control-allow-origin': '*'})
    if '/api/tx/' in u: return j({'vin': [{}], 'vout': [{'value': 546}, {'value': 10000}], 'fee': 500, 'status': {'confirmed': True, 'block_height': 948242, 'block_time': 1778000000}})
    if '/feed' in u: return j(fx('feed.json'))
    if '/search' in u: return j({'txids': [{'txid': 'e2d10be19c2b73b86e14be99dc237a3d999ba3dfbe6f3e3714590acee2ca481e', 'opcode': 'CETCH', 'blockHeight': 948242}], 'assets': []})
    if '/stats' in u: return j(stats())
    if '/flow' in u: return j({'now': {'settles': 812}})
    if '/reflection/status' in u: return j(fx('status.json'))
    if '/confidential/relay' in u: return j(fx('relay.json'))
    if '/confidential/index' in u:
        e = [{'seq': 1, 'type': 'wrap', 'block': 26328200, 'tx': '0x' + '01' * 32, 'assetId': '0x3cba71e1114af183cdeacc6b8457a474d17529fd28704480ca799d0d03126f34', 'amount': '2000000000000000'},
             {'seq': 2, 'type': 'nullifiers', 'block': 26328210, 'tx': '0x' + '02' * 32, 'nullifiers': ['0x1', '0x2']},
             {'seq': 3, 'type': 'leaves', 'block': 26328210, 'tx': '0x' + '02' * 32, 'first': 5356, 'leaves': ['0x1', '0x2'], 'memos': ['0x', '0x']}]
        return j({'total': 13335, 'indexedToBlock': 26328254, 'synced': True, 'entries': e if 'limit=40' in u else []})
    if '/assets' in u: return j(fx('assets.json'))
    if '/amm/pools' in u: return j(fx('amm-pools.json'))
    if '/burndep-list' in u: return j([{'txid': 'ab', 'missing': []}])
    if '/points/' in u: return j({'points': 1234})
    print('UNMOCKED', u); return route.fulfill(status=404, body='{}')

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), functools.partial(Q, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    pg.route('**/*', handle)
    pg.goto('http://localhost:8765/index.html')
    pg.wait_for_timeout(6000)
    for q in sys.argv[1:]:
        pg.fill('#q', q); pg.click('#lookup-form button'); pg.wait_for_timeout(1500)
        print('LOOKUP', q[:20], '→', pg.inner_text('#lookup-out')[:400].replace('\n', ' | '))
    for sel in ['pulse', 'map', 'btc-feed', 'btc-amm', 'btc-assets', 'evm-v1', 'evm-assets', 'evm-pools', 'evm-feed', 'base-feed', 'bridge-relay', 'bridge-flow', 'privacy', 'link-8453', 'link-1']:
        t = pg.inner_text('#' + sel)
        print(f'--- {sel} ({len(t)} chars):', t[:260].replace('\n', ' | '))
    pg.screenshot(path=os.path.join(ROOT, 'test', 'shot.png'), full_page=True)
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(500)
    pg.screenshot(path=os.path.join(ROOT, 'test', 'shot-mobile.png'), full_page=True)
    print('ERRORS:', errs or 'none')
    b.close()
