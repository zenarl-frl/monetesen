"""Read-only adapter for a local Windows MetaTrader 5 terminal.

Normalizes terminal data to the monetasens Broker/Market Bridge API.
No order execution endpoints. MT5 account must use USD for this MVP.
"""
import hmac
import json
import os
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import MetaTrader5 as mt5
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
TOKEN = os.environ.get('MT5_BRIDGE_TOKEN', '')
SYMBOLS = json.loads(os.environ.get('MT5_SYMBOLS', '{"XAU/USD":"XAUUSD","EUR/USD":"EURUSD","BTC/USD":"BTCUSD","BBCA.JK":"BBCA"}'))
LOCK = threading.Lock()
TIMEFRAMES = {'1m': mt5.TIMEFRAME_M1, '5m': mt5.TIMEFRAME_M5, '15m': mt5.TIMEFRAME_M15, '1H': mt5.TIMEFRAME_H1, '4H': mt5.TIMEFRAME_H4, '1D': mt5.TIMEFRAME_D1}


def normalized(symbol):
    return next((key for key, value in SYMBOLS.items() if value == symbol), symbol)


def initialize():
    args = {}
    if os.getenv('MT5_LOGIN'):
        args.update(login=int(os.environ['MT5_LOGIN']), password=os.getenv('MT5_PASSWORD', ''), server=os.getenv('MT5_SERVER', ''))
    path = os.getenv('MT5_TERMINAL_PATH')
    ok = mt5.initialize(path, **args) if path else mt5.initialize(**args)
    if not ok:
        raise RuntimeError('MT5 terminal unavailable. Check login and terminal configuration.')


def snapshot():
    account = mt5.account_info()
    if account is None or account.currency != 'USD':
        raise RuntimeError('A connected USD-denominated MT5 account is required.')
    positions = mt5.positions_get()
    if positions is None:
        raise RuntimeError('Unable to read MT5 positions.')
    result = []
    for p in positions:
        side = 'Buy' if p.type == mt5.POSITION_TYPE_BUY else 'Sell'
        order_type = mt5.ORDER_TYPE_BUY if side == 'Buy' else mt5.ORDER_TYPE_SELL
        risk = mt5.order_calc_profit(order_type, p.symbol, p.volume, p.price_open, p.sl) if p.sl else None
        margin = mt5.order_calc_margin(order_type, p.symbol, p.volume, p.price_current)
        if margin is None:
            raise RuntimeError('Unable to calculate position margin.')
        result.append({'id': str(p.ticket), 'symbol': normalized(p.symbol), 'side': side, 'quantity': p.volume,
                       'entry': p.price_open, 'price': p.price_current, 'pnl': p.profit + p.swap,
                       'margin': margin, 'riskAmount': max(0, -risk) if risk is not None else None,
                       'stopLoss': p.sl or None})
    now = datetime.now(timezone.utc)
    deals = mt5.history_deals_get(now - timedelta(days=int(os.getenv('MT5_HISTORY_DAYS', '90'))), now)
    if deals is None:
        raise RuntimeError('Unable to read MT5 deal history.')
    entries = {}
    for deal in deals:
        if deal.entry == mt5.DEAL_ENTRY_IN:
            entries.setdefault(deal.position_id, deal.price)
    trades = []
    for deal in deals:
        if deal.entry not in (mt5.DEAL_ENTRY_OUT, mt5.DEAL_ENTRY_OUT_BY) or deal.type not in (mt5.DEAL_TYPE_BUY, mt5.DEAL_TYPE_SELL):
            continue
        # Historical initial SL is not supplied by MT5 deals: keep risk unknown, never fabricate R.
        trades.append({'id': str(deal.ticket), 'symbol': normalized(deal.symbol),
                       'side': 'Sell' if deal.type == mt5.DEAL_TYPE_BUY else 'Buy',
                       'closedAt': datetime.fromtimestamp(deal.time, timezone.utc).isoformat().replace('+00:00', 'Z'),
                       'pnl': deal.profit + deal.swap + max(0, deal.commission) + max(0, deal.fee),
                       'fees': max(0, -deal.commission) + max(0, -deal.fee), 'riskAmount': None,
                       'entry': entries.get(deal.position_id, deal.price), 'exit': deal.price})
    return {'accountId': str(account.login), 'broker': account.company, 'currency': account.currency,
            'balance': account.balance, 'equity': account.equity, 'margin': account.margin,
            'freeMargin': account.margin_free, 'floatingPnl': account.profit,
            'asOf': now.isoformat().replace('+00:00', 'Z'), 'positions': result, 'trades': trades}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + TOKEN):
            self.respond(401, {'error': 'Unauthorized'})
            return
        try:
            with LOCK:
                initialize()
                path = urlparse(self.path)
                if path.path == '/broker/snapshot':
                    data = snapshot()
                elif path.path == '/market/candles':
                    query = parse_qs(path.query)
                    symbol = SYMBOLS.get(query.get('symbol', [''])[0])
                    timeframe = TIMEFRAMES.get(query.get('timeframe', ['15m'])[0])
                    if not symbol or timeframe is None or not mt5.symbol_select(symbol, True):
                        self.respond(400, {'error': 'Unsupported instrument or timeframe'})
                        return
                    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, 500)
                    if rates is None or len(rates) < 10:
                        raise RuntimeError('Not enough candle history in terminal.')
                    data = [{'time': int(r['time']), 'open': float(r['open']), 'high': float(r['high']),
                             'low': float(r['low']), 'close': float(r['close']), 'volume': int(r['tick_volume'])} for r in rates]
                else:
                    self.respond(404, {'error': 'Not found'})
                    return
            self.respond(200, data)
        except Exception:
            self.respond(502, {'error': 'MT5 data unavailable. Check terminal and adapter configuration.'})

    def respond(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_args):
        pass  # Never log credentials or account payloads.


if __name__ == '__main__':
    if len(TOKEN) < 24:
        raise SystemExit('Set MT5_BRIDGE_TOKEN to at least 24 characters.')
    host, port = os.getenv('MT5_BRIDGE_HOST', '127.0.0.1'), int(os.getenv('MT5_BRIDGE_PORT', '8787'))
    print(f'monetasens MT5 read-only bridge: http://{host}:{port}')
    try:
        ThreadingHTTPServer((host, port), Handler).serve_forever()
    finally:
        mt5.shutdown()
