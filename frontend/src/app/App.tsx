import { lazy, Suspense, useEffect, useState } from 'react';
import {
  Bell,
  Search,
  Send,
  ChevronRight,
  Check,
  X,
  Download,
  WifiOff,
  ArrowUpRight,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { Navigation, Brand, navigation } from '../components/layout/Navigation';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Overview } from '../pages/Overview';
import { Portfolio } from '../pages/Portfolio';
import { Journal } from '../pages/Journal';
import { Intelligence } from '../pages/Intelligence';
import { IntegrationPanel } from '../components/terminal/IntegrationPanel';
import { useTerminal } from '../stores/terminal';
import { captureActiveChart } from '../services/chartCapture';
import { initialPositions, initialTransactions, markets } from '../data/demo';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { signedMoney } from '../lib/format';
import type { Page, Position, Signal, Transaction } from '../types';
const Markets = lazy(() => import('../pages/Markets').then(m => ({ default: m.Markets })));
const Signals = lazy(() => import('../pages/Signals').then(m => ({ default: m.Signals })));

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
function getPage(): Page {
  const hash = window.location.hash.slice(1);
  return navigation.some((n) => n.id === hash) ? (hash as Page) : 'overview';
}
export function App() {
  const [page, setPage] = useState<Page>(getPage);
  const [ledger, setLedger, storageError] = useLocalStorage<{
    transactions: Transaction[];
    positions: Position[];
  }>('monetasens.ledger.v1', { transactions: initialTransactions, positions: initialPositions });
  const mode = useTerminal(s => s.accountMode);
  const tracked = useTerminal(s => s.broker);
  const refresh = useTerminal(s => s.refresh);
  const terminalStorageError = useTerminal(s => s.storageError);
  const tracking = mode === 'broker' && !!tracked;
  const transactions: Transaction[] = tracking ? tracked.snapshot.trades.map(t => ({ id: `${tracked.snapshot.accountId}:${t.id}`, name: t.symbol, kind: t.pnl - t.fees >= 0 ? 'profit' : 'loss', amount: t.pnl - t.fees, date: t.closedAt, note: `${t.side} · Broker auto-sync · Fees ${t.fees}`, riskAmount: t.riskAmount, source: 'broker', brokerId: t.id, fees: t.fees })) : ledger.transactions;
  const positions: Position[] = tracking ? tracked.snapshot.positions.map(p => ({ id: p.id, symbol: p.symbol, name: p.symbol, icon: p.symbol.startsWith('XAU') ? 'Au' : p.symbol.startsWith('BTC') ? '₿' : '€', side: p.side, size: String(p.quantity), value: p.price, pnl: p.pnl, color: p.symbol.startsWith('XAU') ? 'gold' : 'blue' })) : ledger.positions;
  const [signals, setSignals, signalStorageError] = useLocalStorage<Signal[]>(
    'monetasens.signals',
    [],
  );
  const [name, setName, nameStorageError] = useLocalStorage('monetasens.name', 'Alex Morgan');
  const [modal, setModal] = useState<
    'transaction' | 'settings' | 'install' | 'notifications' | 'search' | null
  >(null);
  const [transactionKind, setTransactionKind] = useState<Transaction['kind']>('deposit');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [signalSymbol, setSignalSymbol] = useState('XAU/USD');
  const [marketKey, setMarketKey] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches,
  );
  const [online, setOnline] = useState(navigator.onLine);
  const [notificationsRead, setNotificationsRead] = useLocalStorage(
    'monetasens.notifications-read',
    false,
  );
  const initialTotal = initialTransactions.reduce((s, t) => s + t.amount, 0);
  const cash = tracking ? tracked.snapshot.freeMargin : 4250 + transactions.reduce((s, t) => s + t.amount, 0) - initialTotal;
  const balance = tracking ? tracked.snapshot.equity :
    13553 +
    (cash - 4250) +
    positions.reduce((s, p) => s + p.pnl, 0) -
    initialPositions.reduce((s, p) => s + p.pnl, 0);
  useEffect(() => { void refresh(); const timer = setInterval(() => { if (navigator.onLine) void refresh(); }, 15000); const connect = () => void refresh(); window.addEventListener('online', connect); return () => { clearInterval(timer); window.removeEventListener('online', connect); }; }, [refresh]);
  useEffect(() => {
    const handler = () => {
      setPage(getPage());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const install = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPrompt);
    };
    const didInstall = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener('beforeinstallprompt', install);
    window.addEventListener('appinstalled', didInstall);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    return () => {
      window.removeEventListener('beforeinstallprompt', install);
      window.removeEventListener('appinstalled', didInstall);
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
    };
  }, []);
  function navigate(next: Page) {
    if (next === 'markets') setMarketKey((k) => k + 1);
    window.location.hash = next;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function addTransaction(kind: 'deposit' | 'withdrawal' = 'deposit') {
    if (tracking) { setToast('Akun broker bersifat read-only. Pilih Local paper account untuk mencatat transaksi manual.'); return; }
    setTransactionKind(kind);
    setModal('transaction');
  }
  function saveTransaction(t: Transaction) {
    setLedger((prev) => ({
      ...prev,
      transactions: [t, ...prev.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    setModal(null);
    setToast('Transaksi berhasil dicatat.');
  }
  function closePosition(id: string) {
    if (tracking) return;
    const p = positions.find((p) => p.id === id);
    if (!p) return;
    const t: Transaction = {
      id: crypto.randomUUID(),
      name: p.symbol,
      kind: p.pnl >= 0 ? 'profit' : 'loss',
      amount: p.pnl,
      date: new Date().toISOString(),
      note: `${p.side} ${p.size} · Demo position closed`,
    };
    setLedger((prev) => ({
      positions: prev.positions.filter((p) => p.id !== id),
      transactions: [t, ...prev.transactions],
    }));
    setToast(`${p.symbol} ditutup. Hasilnya tercatat di jurnal.`);
  }
  const current = navigation.find((n) => n.id === page)!;
  function openSignal() { captureActiveChart(); setSignalSymbol(useTerminal.getState().selectedSymbol); navigate('signals'); }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <Navigation
        page={page}
        navigate={navigate}
        onAdd={openSignal}
        onSettings={() => setModal('settings')}
        onInstall={() => setModal('install')}
        name={name}
      />
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <span>My workspace</span>
            <ChevronRight size={14} />
            <strong>{current.label}</strong>
          </div>
          <button className="mobile-brand brand-button" onClick={() => navigate('overview')}>
            <Brand />
          </button>
          <div className="header-actions">
            <button className="primary-button top-signal-button" onClick={openSignal}><Send size={15} />Send Signal</button>
            <button
              className="header-search"
              onClick={() => setModal('search')}
              aria-label="Cari halaman atau aset"
            >
              <Search size={17} />
              <span>Search anything...</span>
              <kbd>⌕</kbd>
            </button>
            <button
              className="notification-button icon-button"
              onClick={() => {
                setModal('notifications');
                setNotificationsRead(true);
              }}
              aria-label="Buka notifikasi"
            >
              <Bell size={19} />
              {!notificationsRead && <i />}
            </button>
            <span className="header-divider" />
            <button
              className="avatar header-avatar"
              onClick={() => setModal('settings')}
              aria-label="Pengaturan profil"
            >
              {name.slice(0, 1)}
            </button>
          </div>
        </header>
        {!online && (
          <div className="offline-banner">
            <WifiOff size={15} />
            Offline mode · Your workspace is still here.
          </div>
        )}
        {(storageError || signalStorageError || nameStorageError || terminalStorageError) && (
          <div className="offline-banner">
            Penyimpanan perangkat tidak tersedia. Perubahan hanya tersimpan dalam sesi ini.
          </div>
        )}
        <main id="main-content" className="main-content" key={page}>
          {mode === 'broker' && <div className="account-tracking-banner">{tracked ? `${tracked.snapshot.broker} · ${tracked.source === 'demo' ? 'Bridge simulator' : 'Broker account'} · Read-only` : 'Broker tracking selected · waiting for snapshot'}{tracked?.stale ? ' · STALE' : ''}</div>}
          <Suspense fallback={<div className="empty-state">Loading your workspace…</div>}>
          {page === 'overview' && (
            <Overview
              balance={balance}
              cash={cash}
              positions={positions}
              transactions={transactions}
              navigate={navigate}
              addTransaction={addTransaction}
              selectTransaction={setSelectedTransaction}
              name={name}
            />
          )}
          {page === 'markets' && (
          <Markets
            key={marketKey}
              onSignal={(symbol) => {
                setSignalSymbol(symbol);
                navigate('signals');
              }}
            />
          )}
          {page === 'portfolio' && (
            <Portfolio
              positions={positions}
              balance={balance}
              cash={cash}
              closePosition={closePosition}
              addFunds={addTransaction}
              readOnly={tracking}
            />
          )}
          {page === 'journal' && (
            <Journal
              key={mode}
              transactions={transactions}
              onSelect={setSelectedTransaction}
              notify={setToast}
              initialEquity={tracking ? tracked.snapshot.balance - transactions.reduce((s, t) => s + t.amount, 0) : 13553 - initialPositions.reduce((s, p) => s + p.pnl, 0) - initialTotal}
            />
          )}
          {page === 'intelligence' && <Intelligence />}
          {page === 'signals' && (
            <Signals
              initialSymbol={signalSymbol}
              signals={signals}
              saveSignal={(signal) => {
                setSignals((previous) => [signal, ...previous]);
                setToast('Sinyal demo berhasil disimpan.');
              }}
              notify={setToast}
            />
          )}
          </Suspense>
          <footer className="page-footer">
            <span>Thoughtful finance. A clearer you.</span>
            <span>
              monetasens © {new Date().getFullYear()}
              <i />
              Made for your next chapter.
            </span>
          </footer>
        </main>
        <button className="desktop-fab" onClick={openSignal}>
          <Send size={18} />
          Send Signal
        </button>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
          <button aria-label="Tutup pemberitahuan" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal === 'transaction' && (
        <Modal
          title={
            transactionKind === 'withdrawal' ? 'A little room to move.' : 'A step toward more.'
          }
          onClose={() => setModal(null)}
        >
          <TransactionForm initialKind={transactionKind} cash={cash} onSave={saveTransaction} />
        </Modal>
      )}
      {selectedTransaction && (
        <Modal title="Transaction details" onClose={() => setSelectedTransaction(null)}>
          <div className="confirmation-amount">
            <small>{selectedTransaction.name}</small>
            <strong className={selectedTransaction.amount >= 0 ? 'positive' : 'negative'}>
              {signedMoney(selectedTransaction.amount)}
            </strong>
          </div>
          <div className="detail-rows">
            <span>
              Type<b>{selectedTransaction.kind}</b>
            </span>
            <span>
              Date
              <b>
                {new Date(selectedTransaction.date).toLocaleDateString('id-ID', {
                  dateStyle: 'long',
                })}
              </b>
            </span>
            <span>
              Status<b className="positive">Completed · Demo</b>
            </span>
          </div>
          <p className="transaction-note">{selectedTransaction.note || 'No additional notes.'}</p>
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Make yourself at home." onClose={() => setModal(null)}>
          <form
            className="transaction-form"
            onSubmit={(e) => {
              e.preventDefault();
              const value = String(new FormData(e.currentTarget).get('name')).trim();
              if (value) {
                setName(value);
                setModal(null);
                setToast('Profil berhasil diperbarui.');
              }
            }}
          >
            <p className="muted">Your personal corner of monetasens.</p>
            <label>
              Your name
              <input name="name" defaultValue={name} maxLength={35} required pattern=".*\S.*" />
            </label>
            <div className="settings-info">
              <Settings2 size={20} />
              <div>
                <strong>Personal demo workspace</strong>
                <p>
                  Currency: USD · Theme: Warm cream
                  <br />
                  Data tersimpan secara lokal di browser ini.
                </p>
              </div>
            </div>
            <button className="primary-button full-width" type="submit">
              Save preferences <Check size={17} />
            </button>
            <button
              type="button"
              className="secondary-button full-width"
              onClick={() => setModal('install')}
            >
              <Download size={17} />
              Install app
            </button>
          </form>
          <IntegrationPanel />
        </Modal>
      )}
      {modal === 'install' && (
        <Modal title="Your world. One tap away." onClose={() => setModal(null)}>
          <div className="install-modal-icon">
            <Download size={30} />
          </div>
          <p>
            Pasang monetasens di home screen untuk pengalaman aplikasi penuh, termasuk akses offline
            setelah kunjungan pertama.
          </p>
          {installed ? (
            <div className="soft-badge">
              <Check size={18} />
              monetasens sudah terpasang
            </div>
          ) : installPrompt ? (
            <button
              className="primary-button full-width"
              onClick={async () => {
                await installPrompt.prompt();
                const choice = await installPrompt.userChoice;
                setInstallPrompt(null);
                if (choice.outcome === 'accepted') {
                  setModal(null);
                  setToast('monetasens sedang dipasang.');
                }
              }}
            >
              Install monetasens <ArrowUpRight size={17} />
            </button>
          ) : (
            <div className="install-steps">
              <h3>Android / Chrome / Edge</h3>
              <p>
                Buka menu browser → <b>Install app</b> atau <b>Add to Home screen</b>.
              </p>
              <h3>iPhone / iPad (Safari)</h3>
              <p>
                Ketuk <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.
              </p>
              <small className="muted">Instalasi tersedia melalui HTTPS atau localhost.</small>
            </div>
          )}
        </Modal>
      )}
      {modal === 'notifications' && (
        <Modal title="A little heads-up." onClose={() => setModal(null)}>
          <div className="notification-item">
            <ShieldCheck size={22} />
            <div>
              <strong>Your workspace is ready.</strong>
              <p>
                Portofolio demo sudah disiapkan. Jelajahi aset, catat transaksi, dan temukan ritme
                Anda.
              </p>
              <small>Welcome to monetasens</small>
            </div>
          </div>
          <div className="notification-item">
            <Bell size={22} />
            <div>
              <strong>Keep an eye on the bigger picture.</strong>
              <p>Jelajahi contoh kalender ekonomi dan sesi pasar di Macro Intelligence.</p>
              <button
                className="text-button"
                onClick={() => {
                  setModal(null);
                  navigate('intelligence');
                }}
              >
                Explore calendar <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}
      {modal === 'search' && (
        <Modal
          title="Find your perspective."
          onClose={() => {
            setModal(null);
            setSearch('');
          }}
        >
          <label className="search-input modal-search">
            <Search size={18} />
            <input
              autoFocus
              placeholder="Search pages or assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="search-results">
            {navigation
              .filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
              .map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    navigate(n.id);
                    setModal(null);
                    setSearch('');
                  }}
                >
                  <n.icon size={20} />
                  <span>{n.label}</span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            {markets
              .filter((m) => `${m.symbol} ${m.name}`.toLowerCase().includes(search.toLowerCase()))
              .map((m) => (
                <button
                  key={m.symbol}
                  onClick={() => {
                    sessionStorage.setItem('monetasens.market', m.symbol);
                    navigate('markets');
                    setModal(null);
                    setSearch('');
                  }}
                >
                  <span className="search-asset-icon">{m.icon}</span>
                  <span>
                    {m.symbol}
                    <small>{m.name}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            {!navigation.some((n) => n.label.toLowerCase().includes(search.toLowerCase())) &&
              !markets.some((m) =>
                `${m.symbol} ${m.name}`.toLowerCase().includes(search.toLowerCase()),
              ) && <p className="muted centered">No matches. Coba “Gold” atau “Portfolio”.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
