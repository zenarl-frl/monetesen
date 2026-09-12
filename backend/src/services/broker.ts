import { snapshotSchema, type Snapshot } from '../contracts.js';
import type { Config } from '../config.js';
import { bridgeGet } from '../providers/bridge.js';
import { demoSnapshot } from '../providers/demo.js';
import type { Storage } from './storage.js';

export function exposure(snapshot: Snapshot, maxRisk: number, maxMargin: number) {
  const unknownRisk = snapshot.positions.some(p => p.riskAmount === null);
  const knownRisk = snapshot.positions.reduce((sum, p) => sum + (p.riskAmount ?? 0), 0);
  const riskPercent = snapshot.equity > 0 ? knownRisk / snapshot.equity * 100 : null;
  const marginPercent = snapshot.equity > 0 ? snapshot.margin / snapshot.equity * 100 : null;
  const alerts: string[] = [];
  if (unknownRisk) alerts.push('Sebagian posisi tidak memiliki estimasi stop-loss risk. Total exposure belum lengkap.');
  if (snapshot.equity <= 0) alerts.push('Equity tidak positif. Periksa kondisi akun segera.');
  if (riskPercent !== null && riskPercent > maxRisk) alerts.push(`Risk exposure ${riskPercent.toFixed(2)}% melewati batas ${maxRisk}%.`);
  if (marginPercent !== null && marginPercent > maxMargin) alerts.push(`Margin terpakai ${marginPercent.toFixed(2)}% melewati batas ${maxMargin}%.`);
  return { riskPercent, marginPercent, unknownRisk, marginLevel: snapshot.margin > 0 ? snapshot.equity / snapshot.margin * 100 : null, alerts };
}
export class BrokerService {
  private inFlight: Promise<Snapshot> | null = null;
  private lastSuccess = 0;
  constructor(private config: Config, private storage: Storage) {}
  async sync(): Promise<Snapshot> {
    if (this.inFlight) return this.inFlight;
    const cached = this.storage.read().snapshot;
    if (cached && Date.now() - this.lastSuccess < 10000) return cached;
    this.inFlight = this.fetchSnapshot().finally(() => { this.inFlight = null; });
    return this.inFlight;
  }
  private async fetchSnapshot() {
    const c = this.config;
    const existing = this.storage.read().snapshot;
    const fresh = c.BROKER_PROVIDER === 'bridge'
      ? await bridgeGet(c.BROKER_BRIDGE_URL, '/broker/snapshot', c.BROKER_BRIDGE_TOKEN, snapshotSchema)
      : existing?.accountId === 'demo-mt5-001' ? { ...existing, asOf: new Date().toISOString() } : demoSnapshot();
    // Deal IDs are broker-scoped. Polling is idempotent; corrections replace prior values.
    const history = new Map((existing?.accountId === fresh.accountId ? existing.trades : []).map(t => [t.id, t]));
    fresh.trades.forEach(t => history.set(t.id, t));
    const merged = { ...fresh, trades: [...history.values()].sort((a, b) => b.closedAt.localeCompare(a.closedAt)) };
    await this.storage.update(state => { state.snapshot = merged; });
    this.lastSuccess = Date.now();
    return merged;
  }
}
