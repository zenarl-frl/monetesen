import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Crosshair, Maximize2, Send, RefreshCw } from 'lucide-react';
import { markets } from '../data/demo';
import { AssetIcon, EmptyState, SectionHeading } from '../components/ui/Primitives';
import { TradingChart, type ChartHandle } from '../components/charts/TradingChart';
import { NewsLock } from '../components/terminal/NewsLock';
import { useTerminal } from '../stores/terminal';
import { registerChartCapture } from '../services/chartCapture';
import { averageTrueRange, detectZones } from '../lib/zones';
import { price, money, riskReward } from '../lib/format';
import type { RiskLevel, Timeframe } from '../types/api';

export function Markets({ onSignal }: { onSignal: (symbol: string) => void }) {
  const symbol = useTerminal(s => s.selectedSymbol); const timeframe = useTerminal(s => s.timeframe);
  const feed = useTerminal(s => s.feeds[`${symbol}:${timeframe}`]);
  const loadMarket = useTerminal(s => s.loadMarket); const setPreferences = useTerminal(s => s.setPreferences);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'All'>('All');
  const [overlays, setOverlays] = useState({ snr: true, snd: true, liquidity: false });
  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy'); const [risk, setRisk] = useState(1);
  const [account, setAccount] = useState(10000); const [ratio, setRatio] = useState(3);
  const [entry, setEntry] = useState(0); const [stop, setStop] = useState(0); const [target, setTarget] = useState(0);
  const [pick, setPick] = useState<'entry' | 'stop' | 'target' | null>(null);
  const [snapshot, setSnapshot] = useState<string>();
  const handle = useRef<ChartHandle>(null); const initialized = useRef('');
  const market = markets.find(m => m.symbol === symbol) || markets[0];
  const candles = feed?.candles || [];
  useEffect(() => {
    const old = sessionStorage.getItem('monetasens.market');
    if (old && markets.some(m => m.symbol === old)) { setPreferences({ selectedSymbol: old }); sessionStorage.removeItem('monetasens.market'); }
  }, [setPreferences]);
  useEffect(() => {
    let active = true;
    const refresh = async () => { setLoading(true); try { await loadMarket(symbol, timeframe); if (active) setError(''); } catch (e) { if (active) setError((e as Error).message); } finally { if (active) setLoading(false); } };
    void refresh(); const timer = setInterval(refresh, 15000); return () => { active = false; clearInterval(timer); };
  }, [symbol, timeframe, loadMarket]);
  useEffect(() => {
    if (!candles.length || initialized.current === `${symbol}:${timeframe}`) return;
    const last = candles[candles.length - 1].close, distance = averageTrueRange(candles) * 2;
    setEntry(last); setStop(last - distance); setTarget(last + distance * 3); setSide('Buy'); setRatio(3); setSnapshot(undefined);
    initialized.current = `${symbol}:${timeframe}`;
  }, [candles, symbol, timeframe]);
  const allZones = useMemo(() => detectZones(candles), [candles]);
  const visibleZones = useMemo(() => allZones.filter(z => (riskFilter === 'All' || z.risk === riskFilter) && (z.type.startsWith('Liquidity') ? overlays.liquidity : ['Supply', 'Demand'].includes(z.type) ? overlays.snd : overlays.snr)), [allZones, riskFilter, overlays]);
  const rr = riskReward(entry, stop, target, side); const riskAmount = account * risk / 100;
  const levels = useMemo(() => ({ entry, stop, target }), [entry, stop, target]);
  const prepare = useCallback(() => {
    const image = handle.current?.capture(); setSnapshot(image);
    useTerminal.getState().setDraft({ symbol, side, entry, stop, tp1: target, tp2: side === 'Buy' ? target + Math.abs(entry - stop) : target - Math.abs(entry - stop), riskPercent: risk, riskLevel: riskFilter === 'All' ? risk <= 1 ? 'Low' : risk <= 2 ? 'Medium' : 'High' : riskFilter, timeframe, image, capturedAt: new Date().toISOString(), source: feed?.source });
  }, [symbol, side, entry, stop, target, risk, riskFilter, timeframe, feed?.source]);
  useEffect(() => registerChartCapture(prepare), [prepare]);
  function applyRatio(value: number) { setRatio(value); setTarget(entry + Math.abs(entry - stop) * value * (side === 'Buy' ? 1 : -1)); }
  function changeSide(value: 'Buy' | 'Sell') { setSide(value); const distance = Math.abs(entry - stop); setStop(entry + distance * (value === 'Buy' ? -1 : 1)); setTarget(entry + distance * ratio * (value === 'Buy' ? 1 : -1)); }
  return <><div className="page-heading"><div><div className="eyebrow">FIND YOUR NEXT OPPORTUNITY</div><h1>Market perspective<span className="coral">.</span></h1><p>Price action, context, and a considered plan.</p></div><span className="outline-badge">{feed?.source === 'bridge' ? 'Provider feed' : 'Demo OHLC'} · {error ? 'Cached / offline' : '15s refresh'}</span></div>
    <NewsLock symbol={symbol} />
    <div className="workspace-grid"><div className="main-column">
      <div className="market-selector">{markets.map(m => <button key={m.symbol} className={symbol === m.symbol ? 'selected' : ''} onClick={() => setPreferences({ selectedSymbol: m.symbol })}>{m.icon}<span>{m.symbol}</span></button>)}</div>
      {error && <p className="form-error" role="status">{error}</p>}
      <section className="dark-card trading-card"><div className="section-heading"><div className="asset-heading"><AssetIcon text={market.icon} color={market.color} /><div><h2>{symbol}</h2><small className="muted">{market.name} · Lightweight Charts™</small></div></div><button className="plain-icon" aria-label="Fit chart" onClick={() => handle.current?.fit()}><Maximize2 size={18} /></button></div>
        <div className="trading-price">{candles.length ? price(candles[candles.length - 1].close) : '—'}{loading && <RefreshCw size={17} className="animate-spin" />}</div>
        <div className="period-pills">{(['1m', '5m', '15m', '1H', '4H', '1D'] as Timeframe[]).map(t => <button key={t} className={t === timeframe ? 'active' : ''} onClick={() => setPreferences({ timeframe: t })}>{t}</button>)}</div>
        <div className="overlay-controls">{([{ key: 'snr', label: 'SnR' }, { key: 'snd', label: 'Supply / Demand' }, { key: 'liquidity', label: 'Liquidity' }] as const).map(o => <button key={o.key} className={`zone-toggle ${overlays[o.key] ? 'active' : ''}`} onClick={() => setOverlays(prev => ({ ...prev, [o.key]: !prev[o.key] }))} aria-pressed={overlays[o.key]}>{o.label}</button>)}</div>
        <TradingChart ref={handle} candles={candles} zones={visibleZones} levels={levels} symbol={symbol} pick={pick} onPick={value => { const rounded = Number(value.toFixed(symbol === 'EUR/USD' ? 5 : 2)); if (pick === 'entry') setEntry(rounded); if (pick === 'stop') setStop(rounded); if (pick === 'target') setTarget(rounded); setPick(null); }} />
        {pick && <p className="chart-pick-hint"><Crosshair size={14} />Tap chart to set {pick}<button onClick={() => setPick(null)}>Cancel</button></p>}
        {!candles.length && <p className="muted small centered">{loading ? 'Loading candles…' : 'Hubungkan backend untuk memuat candle pertama.'}</p>}
        <div className="chart-indicators"><span>Candles<b>{candles.length}</b></span><span>ATR (14)<b>{price(averageTrueRange(candles))}</b></span><span>Zones<b>{visibleZones.length}</b></span></div>
      </section>
      <section className="surface-card"><SectionHeading title="Detected market structure" /><div className="filter-pills">{(['All', 'Low', 'Medium', 'High'] as const).map(r => <button className={riskFilter === r ? 'active' : ''} key={r} onClick={() => setRiskFilter(r)}>{r === 'All' ? 'All risk levels' : `${r} risk`}</button>)}</div>
        {visibleZones.slice(0, 8).map(z => <div className="footprint" key={z.id}><span className={`status-dot ${z.bullish ? '' : 'coral-bg'}`} /><div><strong>{z.type}</strong><small>{price(z.low)} – {price(z.high)} · {z.touches} touches</small></div><span className="outline-badge">{z.risk} risk</span></div>)}
        {!visibleZones.length && <EmptyState title="No matching zones" text="Ubah filter risiko atau overlay. Zona dihitung dari candle, bukan level statis." />}<p className="muted small">Pivot terkonfirmasi (3 candle), ATR, displacement, dan equal highs/lows. Klasifikasi risiko bersifat heuristik.</p>
      </section>
    </div><aside className="right-column"><section className="surface-card risk-engine"><SectionHeading title="Interactive risk / reward" /><div className="side-tabs">{(['Buy', 'Sell'] as const).map(s => <button key={s} onClick={() => changeSide(s)} className={side === s ? 'active' : ''}>{s}</button>)}</div>
      {[{ key: 'entry', label: 'Entry price', value: entry, setter: setEntry }, { key: 'stop', label: 'Stop loss', value: stop, setter: setStop }, { key: 'target', label: 'Take profit', value: target, setter: setTarget }].map(f => <div className="chart-price-field" key={f.key}><label>{f.label}<input type="number" step="any" min="0" value={f.value || ''} onChange={e => f.setter(Number(e.target.value))} /></label><button className={`icon-button ${pick === f.key ? 'coral' : ''}`} aria-label={`Pick ${f.key} on chart`} onClick={() => setPick(f.key as typeof pick)}><Crosshair size={18} /></button></div>)}
      <label className="field-label">Target R:R <input aria-label="Target risk reward" type="number" min="0.1" max="50" step="0.1" value={ratio} onChange={e => applyRatio(Number(e.target.value))} /></label><div className="filter-pills">{[2, 3, 4].map(n => <button key={n} onClick={() => applyRatio(n)} className={ratio === n ? 'active' : ''}>1:{n}</button>)}</div>
      <div className="rr-value">1 <span>:</span> {rr?.toFixed(2) || '—'}<small>ACTUAL RISK TO REWARD</small></div><label className="field-label">Account size (USD)<input type="number" min="1" value={account} onChange={e => setAccount(Math.max(0, Number(e.target.value)))} /></label><label className="range-label">Account risk<b>{risk.toFixed(1)}%</b></label><input aria-label="Account risk" type="range" min="0.5" max="5" step="0.5" value={risk} onChange={e => setRisk(Number(e.target.value))} />
      <div className="detail-rows"><span>Risk amount<b className="negative">{money(riskAmount)}</b></span><span>Potential return<b className="positive">{rr ? money(riskAmount * rr) : '—'}</b></span><span>Position size (units)<b>{rr ? (riskAmount / Math.abs(entry - stop)).toFixed(3) : '—'}</b></span></div><p className="muted small">Units = risk ÷ price distance (USD quote). Konversi lot/tick value mengikuti kontrak broker.</p>
      {!rr && <p className="form-error">Periksa arah SL/TP terhadap entry.</p>}<button className="primary-button full-width" disabled={!rr || !candles.length} onClick={() => { prepare(); onSignal(symbol); }}><Send size={17} />Capture & create signal</button><button className="secondary-button full-width" disabled={!candles.length} onClick={prepare}><Camera size={17} />Preview capture</button>{snapshot && <img className="chart-snapshot" src={snapshot} alt="Captured chart with zones and risk reward levels" />}
    </section></aside></div></>;
}
