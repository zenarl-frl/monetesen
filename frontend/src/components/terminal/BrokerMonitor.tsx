import { AlertTriangle, Radio, RefreshCw, Link2 } from 'lucide-react';
import { useTerminal } from '../../stores/terminal';
import { useClock } from '../../hooks/useClock';
import { money, signedMoney } from '../../lib/format';

export function BrokerMonitor() {
  const broker = useTerminal(s => s.broker); const error = useTerminal(s => s.brokerError || s.connectionError);
  const accountMode = useTerminal(s => s.accountMode); const setPreferences = useTerminal(s => s.setPreferences);
  const refresh = useTerminal(s => s.refresh); const now = useClock();
  const stale = !broker || broker.stale || now - new Date(broker.snapshot.asOf).getTime() > 60000;
  return <section className="surface-card broker-monitor"><div className="section-heading"><div><h2><Link2 size={17} />Broker auto-tracking</h2><p className="muted small">Read-only sync · every 15 seconds</p></div><button className="icon-button" onClick={() => void refresh()} aria-label="Refresh broker"><RefreshCw size={17} /></button></div>
    <div className="account-mode"><button onClick={() => setPreferences({ accountMode: 'local' })} className={accountMode === 'local' ? 'active' : ''}>Local paper account</button><button onClick={() => setPreferences({ accountMode: 'broker' })} disabled={!broker} className={accountMode === 'broker' ? 'active' : ''}>Track {broker?.source === 'bridge' ? 'broker account' : 'bridge simulator'}</button></div>
    {broker && <><div className="broker-source"><Radio size={15} /><strong>{broker.snapshot.broker}</strong><span className="outline-badge">{broker.source === 'demo' ? 'DEMO' : 'BRIDGE'} · {stale ? 'STALE' : 'SYNCED'}</span></div><small className="muted">{broker.snapshot.accountId} · Last snapshot {new Date(broker.snapshot.asOf).toLocaleString('id-ID')}</small>
      <div className="broker-metrics">{[['Balance', money(broker.snapshot.balance)], ['Equity', money(broker.snapshot.equity)], ['Floating P&L', signedMoney(broker.snapshot.floatingPnl)], ['Margin level', broker.exposure.marginLevel === null ? 'No margin' : `${broker.exposure.marginLevel.toFixed(1)}%`], ['Used margin', money(broker.snapshot.margin)], ['Risk exposure', broker.exposure.riskPercent === null ? 'Unknown' : `${broker.exposure.riskPercent.toFixed(2)}%${broker.exposure.unknownRisk ? ' + unknown' : ''}`]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      {broker.exposure.alerts.map(alert => <div className="news-lock" key={alert}><AlertTriangle size={18} /><p>{alert}</p></div>)}
      <p className="muted small">{accountMode === 'broker' ? `${broker.snapshot.trades.length} broker deals disinkronkan ke jurnal. Data terpisah dari paper account.` : 'Pilih Track untuk memakai equity, posisi, dan jurnal dari bridge.'}</p>
    </>}{(error || stale) && <p className="form-error" role="status">{error || 'Snapshot terakhir sudah kedaluwarsa. Menunggu broker bridge.'}</p>}
  </section>;
}
