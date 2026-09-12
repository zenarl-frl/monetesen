import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Copy, Check, Camera, Radio, RefreshCw } from 'lucide-react';
import { markets } from '../data/demo';
import { SectionHeading, EmptyState } from '../components/ui/Primitives';
import { IntegrationPanel } from '../components/terminal/IntegrationPanel';
import { TradingChart, type ChartHandle } from '../components/charts/TradingChart';
import { useTerminal, defaultCaption } from '../stores/terminal';
import { api } from '../services/api';
import { price, riskReward } from '../lib/format';
import { pipSize, detectZones } from '../lib/zones';
import { renderCaption } from '../lib/signals';
import type { DispatchRecord, SignalDraft } from '../types/api';
import type { Signal } from '../types';

export function Signals({ initialSymbol, signals, saveSignal, notify }: { initialSymbol: string; signals: Signal[]; saveSignal: (s: Signal) => void; notify: (s: string) => void }) {
  const initial = markets.find(m => m.symbol === initialSymbol) || markets[0];
  const storedDraft = useTerminal(s => s.draft); const status = useTerminal(s => s.status);
  const template = useTerminal(s => s.captionTemplate); const setPreferences = useTerminal(s => s.setPreferences);
  const loadMarket = useTerminal(s => s.loadMarket);
  const [draft, setDraft] = useState<SignalDraft>(() => storedDraft || { symbol: initial.symbol, side: 'Buy', entry: initial.price, stop: initial.price * .995, tp1: initial.price * 1.015, tp2: initial.price * 1.025, riskLevel: 'Low', riskPercent: 1, timeframe: '15m', source: 'demo' });
  const feed = useTerminal(s => s.feeds[`${draft.symbol}:${draft.timeframe}`]);
  const [image, setImage] = useState(draft.image); const [error, setError] = useState(''); const [feedError, setFeedError] = useState('');
  const [copied, setCopied] = useState(false); const [busy, setBusy] = useState(false); const [history, setHistory] = useState<DispatchRecord[]>([]);
  const [delivery, setDelivery] = useState<DispatchRecord | null>(null); const requestId = useRef(crypto.randomUUID());
  const chart = useRef<ChartHandle>(null);
  const rr = riskReward(draft.entry, draft.stop, draft.tp1, draft.side);
  const valid = !!rr && (draft.side === 'Buy' ? draft.tp2 >= draft.tp1 : draft.tp2 <= draft.tp1 && draft.tp2 > 0);
  const text = renderCaption(template, { ...draft, source: feed?.source || draft.source });
  const zones = useMemo(() => detectZones(feed?.candles || []).slice(0, 10), [feed?.candles]);
  const levels = useMemo(() => ({ entry: draft.entry, stop: draft.stop, target: draft.tp1 }), [draft.entry, draft.stop, draft.tp1]);
  useEffect(() => { void loadMarket(draft.symbol, draft.timeframe).then(() => setFeedError('')).catch(e => setFeedError(e.message)); }, [draft.symbol, draft.timeframe, loadMarket]);
  useEffect(() => { if (status) void api<{ dispatches: DispatchRecord[] }>('/signals/history').then(data => setHistory(data.dispatches)).catch(() => {}); }, [status]);
  function edit(value: Partial<SignalDraft>) { setDraft(d => ({ ...d, ...value })); setImage(undefined); setDelivery(null); setError(''); requestId.current = crypto.randomUUID(); }
  function changeSymbol(symbol: string) { const m = markets.find(m => m.symbol === symbol)!; const direction = draft.side === 'Buy' ? 1 : -1; edit({ symbol, entry: m.price, stop: m.price * (1 - .005 * direction), tp1: m.price * (1 + .015 * direction), tp2: m.price * (1 + .025 * direction) }); }
  function changeSide(side: 'Buy' | 'Sell') { const distance = Math.abs(draft.entry - draft.stop), direction = side === 'Buy' ? 1 : -1; edit({ side, stop: draft.entry - distance * direction, tp1: draft.entry + distance * 3 * direction, tp2: draft.entry + distance * 5 * direction }); }
  function capture() { const data = chart.current?.capture(); if (data) { setImage(data); return data; } return image; }
  function validate() { if (!valid) { setError('Untuk Buy: stop loss < entry < target, TP2 ≥ TP1. Untuk Sell: TP2 ≤ TP1 < entry < stop loss.'); return false; } if (!draft.riskPercent || draft.riskPercent <= 0 || draft.riskPercent > 100 || !text.trim() || text.length > 3500) { setError('Risk harus 0–100% dan caption 1–3500 karakter.'); return false; } return true; }
  async function send() {
    if (busy || !validate()) return;
    const screenshot = image || capture(); if (!screenshot || !feed?.candles.length) { setError('Chart belum tersedia. Muat data sebelum mengirim gambar.'); return; }
    setBusy(true); setError('');
    try {
      const result = await api<DispatchRecord>('/signals/dispatch', { method: 'POST', body: JSON.stringify({ requestId: requestId.current, symbol: draft.symbol, side: draft.side, entry: draft.entry, stop: draft.stop, tp1: draft.tp1, tp2: draft.tp2, riskLevel: draft.riskLevel, riskPercent: draft.riskPercent, caption: text, image: screenshot }) });
      setDelivery(result); setHistory(prev => [result, ...prev.filter(h => h.id !== result.id)]);
      if (result.status === 'sent') notify('Chart dan sinyal berhasil dikirim ke Telegram.'); else setError(result.error || 'Pengiriman masih diproses. Periksa history / channel.');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <><div className="page-heading"><div><div className="eyebrow">TURN INSIGHT INTO INTENTION</div><h1>Make your next move clear<span className="coral">.</span></h1><p>Capture the chart. Share the complete setup.</p></div><span className="outline-badge"><Radio size={14} />{status?.telegramConfigured ? 'Telegram connected' : 'Local signal studio'}</span></div>
    <div className="workspace-grid"><div className="main-column"><form className="surface-card signal-form" onSubmit={e => { e.preventDefault(); if (validate()) { saveSignal({ id: crypto.randomUUID(), symbol: draft.symbol, side: draft.side, entry: draft.entry, stop: draft.stop, target: draft.tp1, tp2: draft.tp2, riskLevel: draft.riskLevel, riskPercent: draft.riskPercent, date: new Date().toISOString() }); } }}><fieldset disabled={busy}><SectionHeading title="Build your signal" /><label className="field-label" htmlFor="instrument">Instrument</label><select id="instrument" value={draft.symbol} onChange={e => changeSymbol(e.target.value)}>{markets.map(m => <option key={m.symbol} value={m.symbol}>{m.symbol} — {m.name}</option>)}</select><div className="side-tabs">{(['Buy', 'Sell'] as const).map(s => <button type="button" key={s} className={draft.side === s ? 'active' : ''} onClick={() => changeSide(s)}>{s === 'Buy' ? 'Buy / Long' : 'Sell / Short'}</button>)}</div>
      <div className="signal-fields extended">{([{ key: 'entry', label: 'Entry price' }, { key: 'stop', label: 'Stop loss' }, { key: 'tp1', label: 'Take profit 1' }, { key: 'tp2', label: 'Take profit 2' }] as const).map(f => <label key={f.key}>{f.label}<div className="price-input"><span>$</span><input type="number" required min="0.000001" step="any" value={draft[f.key] || ''} onChange={e => edit({ [f.key]: Number(e.target.value) })} /></div></label>)}</div>
      <div className="form-two-columns mt-5"><label className="field-label">SL distance (pips)<input aria-label="SL distance in pips" type="number" min="0.1" step="0.1" value={Number((Math.abs(draft.entry - draft.stop) / pipSize(draft.symbol)).toFixed(1))} onChange={e => edit({ stop: draft.entry + Number(e.target.value) * pipSize(draft.symbol) * (draft.side === 'Buy' ? -1 : 1) })} /></label><label className="field-label">Risk (%)<input aria-label="Signal risk percent" type="number" min="0.1" max="100" step="0.1" value={draft.riskPercent} onChange={e => edit({ riskPercent: Number(e.target.value) })} /></label></div>
      <label className="field-label">Risk level<select value={draft.riskLevel} onChange={e => edit({ riskLevel: e.target.value as SignalDraft['riskLevel'] })}>{['Low', 'Medium', 'High'].map(r => <option key={r}>{r}</option>)}</select></label><div className="signal-rr"><span>Risk / reward · TP1 / TP2</span><b>1:{rr?.toFixed(2) || '—'} / 1:{riskReward(draft.entry, draft.stop, draft.tp2, draft.side)?.toFixed(2) || '—'}</b></div>
      <label className="field-label" htmlFor="caption-template">Caption template</label><textarea id="caption-template" rows={7} maxLength={3500} value={template} onChange={e => { setPreferences({ captionTemplate: e.target.value }); setDelivery(null); requestId.current = crypto.randomUUID(); }} /><p className="template-tokens">{'{pair} {direction} {entry} {sl} {slPips} {tp1} {tp2} {risk} {riskLevel} {rr} {timeframe} {source}'}</p><button type="button" className="text-button" onClick={() => { setPreferences({ captionTemplate: defaultCaption }); setDelivery(null); requestId.current = crypto.randomUUID(); }}>Reset template</button>
      {error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button full-width mt-5" type="submit"><Check size={17} />Save demo signal</button></fieldset></form>
      <section className="surface-card"><SectionHeading title={`Signal history (${signals.length})`} />{signals.length ? signals.map(s => <div className="signal-history-row" key={s.id}><span className={`side-badge ${s.side === 'Sell' ? 'sell' : ''}`}>{s.side}</span><div><strong>{s.symbol}</strong><small>{new Date(s.date).toLocaleString('id-ID')}</small></div><span>{price(s.entry)}<small>Entry</small></span></div>) : <EmptyState icon={<Radio size={28} />} title="Your next idea starts here" text="Setup tersimpan lokal. Delivery Telegram tercatat terpisah." />}</section>
      <section className="surface-card"><SectionHeading title="Telegram delivery history" />{history.map(h => <div className="signal-history-row" key={h.id}><span className="outline-badge">{h.status}</span><div><strong>{h.symbol}</strong><small>{new Date(h.at).toLocaleString('id-ID')}</small></div><small>{h.messageIds.length} message(s)</small></div>)}{!history.length && <p className="muted small">Belum ada pengiriman ke Telegram.</p>}</section>
    </div><aside className="right-column"><section className="dark-card signal-preview"><div className="section-heading"><h2>Chart & caption preview</h2><Camera size={19} /></div><TradingChart ref={chart} symbol={draft.symbol} candles={feed?.candles || []} zones={zones} levels={levels} pick={null} onPick={() => {}} />{image && <details className="capture-details"><summary>Captured image</summary><img className="chart-snapshot" src={image} alt="Chart snapshot for Telegram" /></details>}{feedError && <p className="small negative">{feedError}</p>}<button className="health-link" disabled={busy || !feed?.candles.length} onClick={() => { capture(); setDelivery(null); requestId.current = crypto.randomUUID(); }}><Camera size={16} />Retake chart snapshot</button><pre>{text}</pre><small>{text.length}/3500 characters · {draft.timeframe}</small></section>
      <button className="primary-button full-width" disabled={busy || !status?.telegramConfigured || !!delivery && ['sent', 'pending', 'unknown', 'partial'].includes(delivery.status)} onClick={() => void send()}>{busy ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}{busy ? 'Sending…' : delivery?.status === 'sent' ? 'Sent to Telegram' : 'Send chart & signal'}</button>
      <button className="secondary-button full-width" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { notify('Clipboard tidak tersedia. Salin teks dari preview.'); } }}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied' : 'Copy caption'}</button>
      {!status?.telegramConfigured && <p className="muted small centered">Konfigurasikan bot dan channel pada backend untuk mengaktifkan sendPhoto / sendMessage.</p>}<IntegrationPanel />
    </aside></div></>;
}
