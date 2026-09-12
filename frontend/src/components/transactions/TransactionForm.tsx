import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Transaction } from '../../types';
import { dateKey, money } from '../../lib/format';

export function TransactionForm({
  initialKind,
  cash,
  onSave,
}: {
  initialKind: Transaction['kind'];
  cash: number;
  onSave: (t: Transaction) => void;
}) {
  const [kind, setKind] = useState(initialKind);
  const [error, setError] = useState('');
  return (
    <form
      className="transaction-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const amount = Number(data.get('amount'));
        const name = String(data.get('name')).trim();
        if (!Number.isFinite(amount) || amount <= 0 || !name) {
          setError('Masukkan nama dan nominal yang valid.');
          return;
        }
        if ((kind === 'withdrawal' || kind === 'loss') && amount > cash) {
          setError(`Nominal melebihi saldo tersedia (${money(cash)}).`);
          return;
        }
        const date = String(data.get('date'));
        if (!date || !Number.isFinite(new Date(date).getTime())) {
          setError('Pilih tanggal yang valid.');
          return;
        }
        onSave({
          id: crypto.randomUUID(),
          name,
          kind,
          amount: kind === 'withdrawal' || kind === 'loss' ? -amount : amount,
          date: `${date}T12:00:00`,
          note: String(data.get('note')).trim(),
          riskAmount: data.get('riskAmount') ? Number(data.get('riskAmount')) : null,
          source: 'local',
        });
      }}
    >
      <p className="muted">Catat pergerakan dana di akun demo Anda.</p>
      <label>
        Transaction type
        <select value={kind} onChange={(e) => setKind(e.target.value as Transaction['kind'])}>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="profit">Trading profit</option>
          <option value="loss">Trading loss</option>
        </select>
      </label>
      <label>
        {kind === 'deposit' || kind === 'withdrawal' ? 'Description' : 'Instrument'}
        <input
          name="name"
          required
          maxLength={60}
          placeholder={kind === 'deposit' ? 'Bank transfer' : 'XAU/USD'}
          defaultValue={
            kind === 'deposit'
              ? 'Account deposit'
              : kind === 'withdrawal'
                ? 'Account withdrawal'
                : ''
          }
        />
      </label>
      <div className="form-two-columns">
        <label>
          Amount (USD)
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            max="100000000"
            placeholder="0.00"
            required
          />
        </label>
        <label>
          Date
          <input name="date" type="date" defaultValue={dateKey(new Date())} required />
        </label>
      </div>
      {(kind === 'profit' || kind === 'loss') && <label>Initial risk (USD, optional)<input name="riskAmount" type="number" min="0.01" step="0.01" placeholder="For realized R calculation" /></label>}
      <label>
        Notes <span className="muted">(optional)</span>
        <textarea
          name="note"
          rows={3}
          maxLength={500}
          placeholder="A little context for your future self..."
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary-button full-width" type="submit">
        Save transaction <ArrowUpRight size={17} />
      </button>
      <small className="muted centered">Demo only · No real funds are transferred</small>
    </form>
  );
}
