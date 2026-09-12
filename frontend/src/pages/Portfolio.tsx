import { useState } from 'react';
import { ArrowUpRight, ShieldCheck, Wallet, X, BriefcaseBusiness } from 'lucide-react';
import { AssetIcon, EmptyState, SectionHeading } from '../components/ui/Primitives';
import { Modal } from '../components/ui/Modal';
import { money, signedMoney, price } from '../lib/format';
import type { Position } from '../types';
import { BrokerMonitor } from '../components/terminal/BrokerMonitor';
import { useTerminal } from '../stores/terminal';

export function Portfolio({
  positions,
  balance,
  cash,
  closePosition,
  addFunds,
  readOnly = false,
}: {
  positions: Position[];
  balance: number;
  cash: number;
  closePosition: (id: string) => void;
  addFunds: () => void;
  readOnly?: boolean;
}) {
  const [closing, setClosing] = useState<Position | null>(null);
  const broker = useTerminal(s => s.broker);
  const pnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR FINANCIAL BIG PICTURE</div>
          <h1>
            A little more balance<span className="coral">.</span>
          </h1>
          <p>All your positions. One thoughtful perspective.</p>
        </div>
        <span className="soft-badge">
          <ShieldCheck size={15} /> {readOnly ? 'Tracked account' : 'Demo account'}
        </span>
      </div>
      <BrokerMonitor />
      <div className="portfolio-summary">
        <section className="dark-card">
          <span className="overline">TOTAL EQUITY</span>
          <h2 className="large-number">{money(balance)}</h2>
          <span className="positive">
            <ArrowUpRight size={16} /> {signedMoney(pnl)} floating P&L
          </span>
          <div className="margin-row">
            <span>
              Margin level <b>{readOnly ? broker?.exposure.marginLevel == null ? 'No margin' : `${broker.exposure.marginLevel.toFixed(1)}%` : '842.6% (demo)'}</b>
            </span>
            <div className="progress-track">
              <i style={{ width: '84%' }} />
            </div>
            <small>{readOnly ? 'Risk alerts and freshness are shown in Broker auto-tracking.' : 'Illustrative margin buffer for the paper account.'}</small>
          </div>
        </section>
        <section className="cash-card">
          <Wallet size={24} />
          <span>{readOnly ? 'Free margin' : 'Available cash'}</span>
          <h2>{money(cash)}</h2>
          <button className="text-button" onClick={addFunds} disabled={readOnly}>
            Add funds <ArrowUpRight size={17} />
          </button>
        </section>
        <section className="surface-card allocation-card">
          <SectionHeading title="Asset allocation" />
          <div className="allocation-bar">
            <i />
            <i />
            <i />
          </div>
          {[
            ['Commodities', '48%', 'coral-bg'],
            ['Forex', '32%', 'dark-bg'],
            ['Crypto', '20%', 'taupe-bg'],
          ].map(([name, value, color]) => (
            <div key={name}>
              <span>
                <i className={`legend-dot ${color}`} />
                {name}
              </span>
              <b>{value}</b>
            </div>
          ))}
          <small className="muted">Illustrative target allocation</small>
        </section>
      </div>
      <section className="surface-card positions-section">
        <SectionHeading title={`Open positions (${positions.length})`} />
        <div className="position-table-head">
          <span>Asset / instrument</span>
          <span>Position</span>
          <span>Market price</span>
          <span>Unrealized P&L</span>
          <span />
        </div>
        {positions.map((p) => (
          <div className="position-row" key={p.id}>
            <div className="asset-heading">
              <AssetIcon text={p.icon} color={p.color} />
              <div>
                <strong>{p.symbol}</strong>
                <small>{p.name}</small>
              </div>
            </div>
            <div>
              <span className={`side-badge ${p.side === 'Sell' ? 'sell' : ''}`}>{p.side}</span>
              <small>{p.size}</small>
            </div>
            <strong>{price(p.value)}</strong>
            <strong className={p.pnl >= 0 ? 'positive' : 'negative'}>{signedMoney(p.pnl)}</strong>
            <button
              className="icon-button"
              onClick={() => setClosing(p)}
              aria-label={`Tutup posisi ${p.symbol}`}
              disabled={readOnly}
              title={readOnly ? 'Close orders from your broker terminal' : 'Close demo position'}
            >
              <X size={17} />
            </button>
          </div>
        ))}
        {!positions.length && (
          <EmptyState
            icon={<BriefcaseBusiness size={30} />}
            title="A clean slate"
            text="Semua posisi demo telah ditutup. Hasilnya tersedia di jurnal Anda."
          />
        )}
      </section>
      <div className="portfolio-bottom">
        <section className="surface-card">
          <SectionHeading title="Connected workspace" />
          <div className="broker-row">
            <span className="broker-icon">M</span>
            <div>
              <strong>{readOnly ? broker?.snapshot.broker : 'monetasens Demo'}</strong>
              <small>{readOnly ? 'Read-only · USD account' : 'Paper trading · USD account'}</small>
            </div>
            <span className="soft-badge">{readOnly ? 'Bridge' : 'Local'}</span>
          </div>
          <p className="muted small">
            {readOnly ? 'Posisi dan jurnal mengikuti data snapshot broker. Eksekusi order dilakukan di terminal broker.' : 'Akun simulasi di perangkat ini. Nilai pasar dan margin merupakan data ilustrasi.'}
          </p>
        </section>
        <section className="insight-card mini-insight">
          <ShieldCheck size={24} />
          <h2>Protect your progress.</h2>
          <p>Keep your risk small and your perspective wide. Good habits compound.</p>
        </section>
      </div>
      {closing && (
        <Modal title="Close demo position?" onClose={() => setClosing(null)}>
          <p>
            Posisi <b>{closing.symbol}</b> ({closing.size}) akan ditutup dan hasilnya dicatat ke
            jurnal.
          </p>
          <div className="confirmation-amount">
            <small>Realized P&L</small>
            <strong className={closing.pnl >= 0 ? 'positive' : 'negative'}>
              {signedMoney(closing.pnl)}
            </strong>
          </div>
          <button
            className="primary-button full-width"
            onClick={() => {
              closePosition(closing.id);
              setClosing(null);
            }}
          >
            Confirm close position
          </button>
          <button className="secondary-button full-width" onClick={() => setClosing(null)}>
            Keep position open
          </button>
        </Modal>
      )}
    </>
  );
}
