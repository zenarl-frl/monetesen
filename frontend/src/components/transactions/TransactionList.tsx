import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { Transaction } from '../../types';
import { signedMoney } from '../../lib/format';
import { EmptyState } from '../ui/Primitives';

export function TransactionList({
  transactions,
  onSelect,
}: {
  transactions: Transaction[];
  onSelect?: (transaction: Transaction) => void;
}) {
  if (!transactions.length)
    return (
      <EmptyState
        title="Belum ada aktivitas"
        text="Transaksi yang Anda tambahkan akan muncul di sini."
      />
    );
  return (
    <div className="transaction-list">
      {transactions.map((t) => {
        const Icon =
          t.kind === 'deposit'
            ? ArrowDownLeft
            : t.kind === 'withdrawal'
              ? ArrowUpRight
              : t.kind === 'profit'
                ? TrendingUp
                : TrendingDown;
        return (
          <button className="transaction-row" key={t.id} onClick={() => onSelect?.(t)}>
            <span className={`transaction-icon ${t.kind === 'deposit' ? 'deposit' : ''}`}>
              <Icon size={19} />
            </span>
            <span className="transaction-name">
              <strong>{t.name}</strong>
              <small>
                {t.kind === 'deposit'
                  ? 'Deposit'
                  : t.kind === 'withdrawal'
                    ? 'Withdrawal'
                    : 'Closed position'}{' '}
                <span className="transaction-date">
                  ·{' '}
                  {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </small>
            </span>
            <span className={`transaction-amount ${t.amount >= 0 ? 'positive' : ''}`}>
              {signedMoney(t.amount)}
              <small>Completed</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
