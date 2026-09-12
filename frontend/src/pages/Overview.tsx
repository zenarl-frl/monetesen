import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  BriefcaseBusiness,
  Wallet,
  Eye,
  EyeOff,
  Plus,
  ShieldCheck,
  Sparkles,
  Globe2,
  TrendingUp,
} from 'lucide-react';
import { EquityChart, periods, Sparkline } from '../components/charts/EquityChart';
import { AssetIcon, MetricCard, SectionHeading } from '../components/ui/Primitives';
import { TransactionList } from '../components/transactions/TransactionList';
import { markets } from '../data/demo';
import { money, price } from '../lib/format';
import type { Page, Position, Transaction } from '../types';

type Props = {
  balance: number;
  cash: number;
  positions: Position[];
  transactions: Transaction[];
  navigate: (page: Page) => void;
  addTransaction: (kind?: 'deposit' | 'withdrawal') => void;
  selectTransaction: (t: Transaction) => void;
  name: string;
};
export function Overview({
  balance,
  cash,
  positions,
  transactions,
  navigate,
  addTransaction,
  selectTransaction,
  name,
}: Props) {
  const [period, setPeriod] = useState('1M');
  const [hidden, setHidden] = useState(false);
  const floatingPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-sun">✳</span> A LITTLE CLARITY, EVERY DAY
          </div>
          <h1>
            Welcome back, {name.split(' ')[0]}
            <span className="coral">.</span>
          </h1>
          <p>Let’s put your money in perspective.</p>
        </div>
        <div className="heading-date">
          <span className="status-dot" /> Demo workspace <span className="date-divider" />
          12 September, 2026
        </div>
      </div>
      <div className="overview-grid">
        <section className="main-column">
          <div className="balance-card dark-card">
            <div className="balance-top">
              <span className="overline">
                TOTAL PORTFOLIO VALUE{' '}
                <button
                  className="plain-icon"
                  onClick={() => setHidden(!hidden)}
                  aria-label={hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                >
                  {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
              <span className="subtle-pill">
                USD <span>⌄</span>
              </span>
            </div>
            <div className="balance-value">
              {hidden ? '••,•••.••' : money(balance)}
              <span className="balance-currency">USD</span>
            </div>
            <div className="balance-performance">
              <span>
                <ArrowUpRight size={14} /> +8.24%
              </span>
              <span>
                {hidden ? '••••' : '+$1,031.44'} <i>vs. last month</i>
              </span>
            </div>
            <div className="chart-caption">
              <span>
                <span className="legend-dot" /> Portfolio performance
              </span>
              <span>ILLUSTRATIVE DATA</span>
            </div>
            <EquityChart period={period} />
            <div className="chart-bottom">
              <div className="period-pills">
                {periods.map((p) => (
                  <button
                    key={p}
                    className={period === p ? 'active' : ''}
                    onClick={() => setPeriod(p)}
                    aria-pressed={period === p}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <span className="chart-trend">
                <TrendingUp size={15} /> Growing steadily
              </span>
            </div>
          </div>
          <div className="quick-actions">
            <button onClick={() => addTransaction('deposit')}>
              <span>
                <ArrowDownLeft size={18} />
              </span>
              Add funds
            </button>
            <button onClick={() => addTransaction('withdrawal')}>
              <span>
                <ArrowUpRight size={18} />
              </span>
              Withdraw
            </button>
            <button onClick={() => navigate('journal')}>
              <span>
                <Plus size={18} />
              </span>
              Trading journal
            </button>
            <button onClick={() => navigate('portfolio')}>
              <span>
                <BriefcaseBusiness size={18} />
              </span>
              My portfolio
            </button>
          </div>
          <section className="watchlist-section">
            <SectionHeading
              title="Your watchlist"
              aside="Explore markets"
              onClick={() => navigate('markets')}
            />
            <div className="watchlist-grid">
              {markets.slice(0, 3).map((m) => (
                <button
                  className="watch-card"
                  key={m.symbol}
                  onClick={() => {
                    sessionStorage.setItem('monetasens.market', m.symbol);
                    navigate('markets');
                  }}
                >
                  <div className="watch-card-top">
                    <AssetIcon text={m.icon} color={m.color} />
                    <ArrowUpRight size={17} className="muted" />
                  </div>
                  <strong>{m.symbol}</strong>
                  <small>{m.name}</small>
                  <Sparkline points={m.points} negative={m.change < 0} />
                  <div className="watch-card-bottom">
                    <b>{price(m.price)}</b>
                    <span className={m.change < 0 ? 'negative' : 'positive'}>
                      {m.change > 0 ? '+' : ''}
                      {m.change}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="activity-section">
            <SectionHeading
              title="Recent activity"
              aside="View all"
              onClick={() => navigate('journal')}
            />
            <TransactionList transactions={transactions.slice(0, 4)} onSelect={selectTransaction} />
          </section>
        </section>
        <aside className="right-column">
          <div className="metrics-grid">
            <MetricCard
              label="Open positions"
              value={String(positions.length).padStart(2, '0')}
              detail={`${floatingPnl >= 0 ? '+' : '−'}${money(Math.abs(floatingPnl))} unrealized`}
              icon={<BriefcaseBusiness size={19} />}
              onClick={() => navigate('portfolio')}
            />
            <MetricCard
              label="Available cash"
              value={money(cash)}
              detail="Ready for your next move"
              icon={<Wallet size={19} />}
              onClick={() => addTransaction('deposit')}
            />
          </div>
          <section className="health-card dark-card">
            <div className="section-heading">
              <h2>Portfolio health</h2>
              <ShieldCheck size={20} />
            </div>
            <div className="health-content">
              <div className="health-ring">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="49" fill="none" stroke="#ffffff16" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="49"
                    fill="none"
                    stroke="#FF4D4D"
                    strokeWidth="8"
                    strokeDasharray="265 308"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div>
                  <strong>
                    86<span>/100</span>
                  </strong>
                  <small>Looking healthy</small>
                </div>
              </div>
              <div className="health-stats">
                <span>
                  Risk exposure
                  <b>
                    Low <i className="status-dot" />
                  </b>
                </span>
                <span>
                  Margin level<b>842.6%</b>
                </span>
                <span>
                  Diversification<b>Balanced</b>
                </span>
              </div>
            </div>
            <button className="health-link" onClick={() => navigate('portfolio')}>
              A good balance. Keep it that way.
              <ArrowUpRight size={16} />
            </button>
          </section>
          <section className="insight-card">
            <div className="overline">
              <Sparkles size={16} /> THE BIGGER PICTURE
            </div>
            <h2>
              Small steps.
              <br />
              Stronger portfolio.
            </h2>
            <p>Your consistency is paying off. You’ve closed 3 profitable trades this week.</p>
            <button onClick={() => navigate('journal')}>
              See your progress <ArrowUpRight size={17} />
            </button>
            <div className="insight-art" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          </section>
          <section className="market-pulse">
            <SectionHeading
              title="On the radar"
              aside="All insights"
              onClick={() => navigate('intelligence')}
            />
            <div className="pulse-heading">
              <span className="pulse-icon">
                <Globe2 size={20} />
              </span>
              <div>
                <strong>Markets never stand still.</strong>
                <small>Stay one step ahead.</small>
              </div>
            </div>
            <button className="event-preview" onClick={() => navigate('intelligence')}>
              <div>
                <span className="event-time">19:30 WIB</span>
                <span className="impact-badge">High impact</span>
              </div>
              <strong>US Consumer Price Index</strong>
              <span className="event-preview-bottom">
                USD · Inflation report <ArrowRight size={16} />
              </span>
            </button>
          </section>
          <div className="gentle-note">
            <ShieldCheck size={15} />
            <span>
              Your perspective. Your pace.
              <br />
              <b>A little more confident, every day.</b>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
