import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { CandlestickSeries, ColorType, CrosshairMode, HistogramSeries, LineStyle, createChart, type IChartApi, type ISeriesApi, type IPriceLine, type UTCTimestamp } from 'lightweight-charts';
import type { Candle } from '../../types/api';
import type { Zone } from '../../lib/zones';
import { ZonePrimitive } from './ZonePrimitive';

export type ChartHandle = { capture: () => string | undefined; fit: () => void };
type Props = { candles: Candle[]; zones: Zone[]; levels: { entry: number; stop: number; target: number }; pick: 'entry' | 'stop' | 'target' | null; onPick: (price: number) => void; symbol: string };
export const TradingChart = forwardRef<ChartHandle, Props>(function TradingChart({ candles, zones, levels, pick, onPick, symbol }, ref) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null); const series = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volume = useRef<ISeriesApi<'Histogram'> | null>(null); const primitive = useRef(new ZonePrimitive());
  const lines = useRef<IPriceLine[]>([]); const interaction = useRef({ pick, onPick }); interaction.current = { pick, onPick };
  useImperativeHandle(ref, () => ({ capture: () => chart.current?.takeScreenshot().toDataURL('image/png'), fit: () => chart.current?.timeScale().fitContent() }), []);
  useEffect(() => {
    if (!container.current) return;
    const c = createChart(container.current, {
      autoSize: true, height: 380, layout: { background: { type: ColorType.Solid, color: '#191919' }, textColor: '#9a9b90', fontFamily: 'Plus Jakarta Sans', fontSize: 10, attributionLogo: true },
      grid: { vertLines: { color: '#ffffff08' }, horzLines: { color: '#ffffff0c' } },
      crosshair: { mode: CrosshairMode.Normal }, rightPriceScale: { borderColor: '#ffffff12', scaleMargins: { top: .08, bottom: .23 } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#ffffff12' },
      handleScroll: { vertTouchDrag: false, horzTouchDrag: true },
    });
    const s = c.addSeries(CandlestickSeries, { upColor: '#cddfd0', downColor: '#ff4d4d', wickUpColor: '#cddfd0', wickDownColor: '#ff4d4d', borderVisible: false, priceFormat: { type: 'price', precision: symbol === 'EUR/USD' ? 5 : 2, minMove: symbol === 'EUR/USD' ? .00001 : .01 } });
    const v = c.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume', lastValueVisible: false, priceLineVisible: false });
    v.priceScale().applyOptions({ scaleMargins: { top: .83, bottom: 0 }, visible: false });
    s.attachPrimitive(primitive.current);
    c.subscribeClick(param => { if (interaction.current.pick && param.point) { const price = s.coordinateToPrice(param.point.y); if (price !== null && price > 0) interaction.current.onPick(price); } });
    chart.current = c; series.current = s; volume.current = v;
    return () => { c.remove(); chart.current = null; series.current = null; volume.current = null; lines.current = []; };
  }, [symbol]);
  const previousRange = useRef('');
  useEffect(() => {
    series.current?.setData(candles.map(c => ({ ...c, time: c.time as UTCTimestamp })));
    volume.current?.setData(candles.map(c => ({ time: c.time as UTCTimestamp, value: c.volume, color: c.close >= c.open ? '#a3c4ab44' : '#ff4d4d44' })));
    const rangeKey = `${symbol}:${candles.length > 1 ? candles[1].time - candles[0].time : 0}`;
    if (previousRange.current !== rangeKey && candles.length) { chart.current?.timeScale().fitContent(); previousRange.current = rangeKey; }
  }, [candles, symbol]);
  useEffect(() => { primitive.current.setZones(zones); }, [zones, symbol]);
  useEffect(() => {
    const s = series.current; if (!s) return;
    lines.current.forEach(line => s.removePriceLine(line));
    lines.current = [{ price: levels.entry, color: '#ffb986', title: 'ENTRY' }, { price: levels.stop, color: '#ff4d4d', title: 'SL' }, { price: levels.target, color: '#88bd94', title: 'TP' }].filter(l => l.price > 0).map(l => s.createPriceLine({ ...l, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true }));
  }, [levels, symbol]);
  return <div ref={container} className={`lightweight-chart ${pick ? 'picking' : ''}`} aria-label={`Interactive ${symbol} candlestick and volume chart`} />;
});
