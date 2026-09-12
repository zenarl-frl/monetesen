import type { IPrimitivePaneView, ISeriesPrimitive, SeriesAttachedParameter } from 'lightweight-charts';
import type { Zone } from '../../lib/zones';

export class ZonePrimitive implements ISeriesPrimitive {
  private params?: SeriesAttachedParameter;
  private zones: Zone[] = [];
  attached(params: SeriesAttachedParameter) { this.params = params; }
  detached() { this.params = undefined; }
  setZones(zones: Zone[]) { this.zones = zones; this.params?.requestUpdate(); }
  paneViews(): IPrimitivePaneView[] {
    return [{ zOrder: () => 'bottom', renderer: () => ({ draw: target => {
      target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
        const p = this.params; if (!p) return;
        for (const zone of this.zones) {
          const y1 = p.series.priceToCoordinate(zone.high), y2 = p.series.priceToCoordinate(zone.low);
          if (y1 === null || y2 === null) continue;
          const start = p.chart.timeScale().timeToCoordinate(zone.start as import('lightweight-charts').UTCTimestamp);
          const x = Math.max(0, start ?? 0); const color = zone.type.startsWith('Liquidity') ? '#d7b673' : zone.bullish ? '#82b895' : '#ff6860';
          ctx.fillStyle = `${color}18`; ctx.fillRect(x, y1, mediaSize.width - x, Math.max(2, y2 - y1));
          ctx.strokeStyle = `${color}88`; ctx.lineWidth = 1; ctx.setLineDash(zone.type.startsWith('Liquidity') ? [4, 5] : []);
          ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(mediaSize.width, y1); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = color; ctx.font = '9px sans-serif'; ctx.fillText(`${zone.type.toUpperCase()} · ${zone.risk}`, x + 5, Math.max(11, y1 - 4));
        }
      });
    } }) }];
  }
}
