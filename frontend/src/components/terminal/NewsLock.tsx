import { AlertTriangle } from 'lucide-react';
import { useTerminal } from '../../stores/terminal';
import { useClock } from '../../hooks/useClock';
import { countdown, wib } from '../../lib/sessions';

export function NewsLock({ symbol }: { symbol: string }) {
  const calendar = useTerminal(s => s.calendar); const window = useTerminal(s => s.newsWindow);
  const now = useClock();
  const events = calendar?.events.filter(e => e.impact === 'High' && (symbol.includes(e.currency) || symbol === 'XAU/USD' && e.currency === 'USD') && new Date(e.at).getTime() > now && new Date(e.at).getTime() - now <= window * 60000) || [];
  if (!events.length) return null;
  const event = events[0];
  return <div className="news-lock" role="status"><AlertTriangle size={21} /><div><strong>NEWS LOCK · {calendar?.source === 'demo' ? 'SIMULASI' : 'HIGH IMPACT'}</strong><p>{event.title} · {wib(event.at)} WIB</p><small>{countdown(new Date(event.at).getTime() - now)} menuju rilis. Pertimbangkan volatilitas sebelum entry.</small></div></div>;
}
