import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api, ApiError } from '../services/api';
import type { BackendStatus, BrokerFeed, CalendarFeed, CandleFeed, SignalDraft, Timeframe } from '../types/api';

type TerminalState = {
  status: BackendStatus | null; requiresLogin: boolean; connectionError: string;
  calendar: CalendarFeed | null; broker: BrokerFeed | null; feeds: Record<string, CandleFeed>;
  accountMode: 'local' | 'broker'; selectedSymbol: string; timeframe: Timeframe;
  draft: SignalDraft | null; captionTemplate: string; newsWindow: number;
  calendarError: string; brokerError: string; storageError: boolean;
  setPreferences: (value: Partial<Pick<TerminalState, 'accountMode' | 'selectedSymbol' | 'timeframe' | 'captionTemplate' | 'newsWindow'>>) => void;
  setDraft: (draft: SignalDraft) => void;
  refresh: () => Promise<void>; loadMarket: (symbol: string, timeframe: Timeframe) => Promise<CandleFeed>;
  login: (password: string) => Promise<void>; logout: () => Promise<void>;
};
export const defaultCaption = 'monetasens · {source}\n{direction} {pair} · {timeframe}\n\nEntry: {entry}\nStop loss: {sl} ({slPips} pips)\nTP1: {tp1}\nTP2: {tp2}\nRisk: {risk}% · {riskLevel}\nR:R: 1:{rr}\n\nTrade your plan. Protect your progress.';
let refreshPromise: Promise<void> | null = null;
export const useTerminal = create<TerminalState>()(persist((set, get) => ({
  status: null, requiresLogin: false, connectionError: '', calendarError: '', brokerError: '', storageError: false,
  calendar: null, broker: null, feeds: {}, accountMode: 'local', selectedSymbol: 'XAU/USD', timeframe: '15m', draft: null,
  captionTemplate: defaultCaption, newsWindow: 60,
  setPreferences: value => set(value), setDraft: draft => set({ draft }),
  refresh: () => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const status = await api<BackendStatus>('/status'); set({ status, requiresLogin: false, connectionError: '' });
        await Promise.all([
          api<CalendarFeed>('/calendar').then(calendar => set({ calendar, calendarError: '' })).catch(e => set({ calendarError: e.message })),
          api<BrokerFeed>('/broker/snapshot').then(broker => set({ broker, brokerError: broker.error || '' })).catch(e => set({ brokerError: e.message })),
        ]);
      } catch (error) { const e = error as ApiError; set({ connectionError: e.message, requiresLogin: e.status === 401, status: null }); }
    })().finally(() => { refreshPromise = null; });
    return refreshPromise;
  },
  loadMarket: async (symbol, timeframe) => {
    const data = await api<CandleFeed>(`/market/candles?${new URLSearchParams({ symbol, timeframe })}`);
    if (!Array.isArray(data.candles) || !data.candles.length) throw new Error('Provider tidak mengembalikan candle.');
    set({ feeds: { ...get().feeds, [`${symbol}:${timeframe}`]: data } }); return data;
  },
  login: async password => { await api('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }); await get().refresh(); },
  logout: async () => { await api('/auth/logout', { method: 'POST', body: '{}' }); set({ status: null, requiresLogin: true, broker: null, calendar: null, feeds: {}, draft: null, accountMode: 'local' }); },
}), {
  name: 'monetasens.terminal.v2',
  storage: createJSONStorage(() => ({
    getItem: key => { try { return localStorage.getItem(key); } catch { return null; } },
    setItem: (key, value) => { try { localStorage.setItem(key, value); } catch { queueMicrotask(() => { if (!useTerminal.getState().storageError) useTerminal.setState({ storageError: true }); }); } },
    removeItem: key => { try { localStorage.removeItem(key); } catch { /* Session remains available. */ } },
  })),
  partialize: s => ({ calendar: s.calendar, broker: s.broker, feeds: s.feeds, accountMode: s.accountMode, selectedSymbol: s.selectedSymbol, timeframe: s.timeframe, captionTemplate: s.captionTemplate, newsWindow: s.newsWindow }),
}));
