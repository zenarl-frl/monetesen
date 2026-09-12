import {
  LayoutGrid,
  CandlestickChart,
  BriefcaseBusiness,
  BookOpen,
  Globe2,
  Send,
  ArrowUpRight,
  Settings2,
  Download,
  type LucideIcon,
} from 'lucide-react';
import type { Page } from '../../types';

export const navigation: { id: Page; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', short: 'Home', icon: LayoutGrid },
  { id: 'markets', label: 'Markets', short: 'Markets', icon: CandlestickChart },
  { id: 'portfolio', label: 'Portfolio', short: 'Portfolio', icon: BriefcaseBusiness },
  { id: 'journal', label: 'Trading journal', short: 'Journal', icon: BookOpen },
  { id: 'intelligence', label: 'Macro intelligence', short: 'Macro', icon: Globe2 },
  { id: 'signals', label: 'Signal studio', short: 'Signals', icon: Send },
];
export function Brand() {
  return (
    <span className="brand">
      <svg viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <path
          d="M5 26V13a4 4 0 0 1 8 0v9-13a4 4 0 0 1 8 0v13-9a4 4 0 0 1 8 0v13"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
      monetasens<span className="brand-dot">.</span>
    </span>
  );
}
export function Navigation({
  page,
  navigate,
  onAdd,
  onSettings,
  onInstall,
  name,
}: {
  page: Page;
  navigate: (p: Page) => void;
  onAdd: () => void;
  onSettings: () => void;
  onInstall: () => void;
  name: string;
}) {
  return (
    <>
      <aside className="sidebar">
        <button
          className="brand-button"
          onClick={() => navigate('overview')}
          aria-label="monetasens home"
        >
          <Brand />
        </button>
        <div className="workspace-label">
          <span className="workspace-logo">m.</span>
          <span>
            Personal workspace<small>Make room for growth.</small>
          </span>
          <span className="workspace-chevron">⌄</span>
        </div>
        <span className="nav-group-label">YOUR WORKSPACE</span>
        <nav aria-label="Navigasi utama">
          {navigation.slice(0, 4).map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => navigate(n.id)}
              aria-current={page === n.id ? 'page' : undefined}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {page === n.id && <span className="nav-active-dot" />}
            </button>
          ))}
          <span className="nav-group-label second">A LITTLE MORE INSIGHT</span>
          {navigation.slice(4).map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => navigate(n.id)}
              aria-current={page === n.id ? 'page' : undefined}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === 'signals' && <span className="new-badge">NEW</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="install-card">
            <span className="install-icon">
              <Download size={19} />
            </span>
            <h3>A little closer to you.</h3>
            <p>
              Your financial world,
              <br />
              right on your home screen.
            </p>
            <button onClick={onInstall}>
              Install monetasens <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="nav-item settings-link" onClick={onSettings}>
            <Settings2 size={19} />
            Settings & preferences
          </button>
          <button className="sidebar-profile" onClick={onSettings}>
            <span className="avatar">{name.slice(0, 1)}</span>
            <span>
              <strong>{name}</strong>
              <small>Personal account</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        </div>
      </aside>
      <div className="mobile-nav-wrap">
        <nav className="mobile-nav" aria-label="Navigasi mobile">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? 'active' : ''}
              onClick={() => navigate(n.id)}
              aria-label={n.label}
              aria-current={page === n.id ? 'page' : undefined}
            >
              <n.icon size={20} />
              <span>{n.short}</span>
            </button>
          ))}
        </nav>
        <button className="mobile-fab" onClick={onAdd} aria-label="Send Signal">
          <Send size={23} />
        </button>
      </div>
    </>
  );
}
