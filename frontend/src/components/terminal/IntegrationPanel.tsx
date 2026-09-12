import { useState } from 'react';
import { Check, LockKeyhole, RefreshCw, Server, LogOut } from 'lucide-react';
import { useTerminal } from '../../stores/terminal';

export function IntegrationPanel() {
  const status = useTerminal(s => s.status); const requiresLogin = useTerminal(s => s.requiresLogin);
  const error = useTerminal(s => s.connectionError); const refresh = useTerminal(s => s.refresh);
  const login = useTerminal(s => s.login); const logout = useTerminal(s => s.logout);
  const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  return <section className="integration-panel"><div className="section-heading"><h2>Backend connections</h2><Server size={20} /></div>
    {requiresLogin ? <form className="transaction-form" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await login(password); setPassword(''); setMessage(''); } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); } }}><label>Workspace password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button className="primary-button full-width" disabled={busy}><LockKeyhole size={16} />{busy ? 'Connecting…' : 'Unlock workspace'}</button></form> : <>
      <div className="detail-rows"><span>API server<b>{status ? 'Connected' : 'Offline'}</b></span><span>Market provider<b>{status?.market || '—'}</b></span><span>Economic calendar<b>{status?.calendar || '—'}</b></span><span>Broker bridge<b>{status?.broker || '—'}</b></span><span>Telegram Bot API<b>{status?.telegramConfigured ? 'Configured' : 'Not configured'}</b></span></div>
      <button type="button" className="secondary-button full-width" disabled={busy} onClick={async () => { setBusy(true); await refresh(); setBusy(false); }}><RefreshCw size={16} />Refresh connections</button>
      {status?.passwordProtected && <button type="button" className="text-button" onClick={async () => { try { await logout(); } catch (e) { setMessage((e as Error).message); } }}><LogOut size={15} />Disconnect session</button>}
    </>}
    {(message || error) && <p className="form-error" role="status">{message || error}</p>}<p className="muted small"><Check size={12} /> Token Telegram dan broker hanya dibaca dari <code>backend/.env</code>. Provider demo tersedia tanpa token.</p>
  </section>;
}
