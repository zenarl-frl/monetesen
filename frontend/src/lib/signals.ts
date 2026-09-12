import { pipSize } from './zones';
import { riskReward, price } from './format';
import type { SignalDraft } from '../types/api';
export function renderCaption(template: string, draft: SignalDraft) {
  const values: Record<string, string> = {
    pair: draft.symbol, direction: draft.side.toUpperCase(), entry: price(draft.entry), sl: price(draft.stop),
    slPips: (Math.abs(draft.entry - draft.stop) / pipSize(draft.symbol)).toFixed(1),
    tp1: price(draft.tp1), tp2: price(draft.tp2), risk: String(draft.riskPercent), riskLevel: draft.riskLevel,
    rr: riskReward(draft.entry, draft.stop, draft.tp1, draft.side)?.toFixed(2) || '—', timeframe: draft.timeframe,
    source: draft.source === 'bridge' ? 'PROVIDER DATA' : 'DEMO SETUP',
  };
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}
