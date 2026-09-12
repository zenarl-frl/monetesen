import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api, ApiError } from '../services/api';
import type { BackendStatus, BrokerFeed, CalendarFeed, CandleFeed, SignalDraft, Timeframe } from '../types/api';

type TerminalState = {
  status: BackendStatus | null; requiresLogin: boolean; connectionError: string;
  calendar: CalendarFeed | null; broker: BrokerFeed | null; feeds: Record<string, CandleFeed & { realtime: boolean }>;
  accountMode: 'local' | 'broker'; selectedSymbol: string; timeframe: Timeframe;
  draft: SignalDraft | null; captionTemplate: string; newsWindow: number;
  realtime: boolean; reconnectAttempts: number; lastReconnect: number;
  calendarError: string; brokerError: string; storageError: boolean;
  setPreferences: (value: Partial<Pick<TerminalState, 'accountMode' | 'selectedSymbol' | 'timeframe' | 'captionTemplate' | 'newsWindow' | 'realtime'>>) => void;
  setDraft: (draft: SignalDraft) => void;
  refresh: () => Promise<void>; loadMarket: (symbol: string, timeframe: Timeframe, realtime?: boolean) => Promise<CandleFeed>; setupRealtime: (symbol: string, timeframe: Timeframe) => void; cleanupRealtime: () => void;
  login: (password: string) => Promise<void>; logout: () => Promise<void>;
};
export const defaultCaption = 'monetasens · {source}\n{direction} {pair} · {timeframe}\n\nEntry: {entry}\nStop loss: {sl} ({slPips} pips)\nTP1: {tp1}\nTP2: {tp2}\nRisk: {risk}% · {riskLevel}\nR:R: 1:{rr}\n\nTrade your plan. Protect your progress.';
let refreshPromise: Promise<void> | null = null;
let realtimeTimeouts: Record<string, NodeJS.Timeout | undefined> = {};
export const useTerminal = create<TerminalState>()(persist((set, get) => ({
  status: null, requiresLogin: false, connectionError: '', calendarError: '', brokerError: '', storageError: false,
  calendar: null, broker: null, feeds: {}, accountMode: 'local', selectedSymbol: 'XAU/USD', timeframe: '15m', draft: null,
  captionTemplate: defaultCaption, newsWindow: 60, realtime: false, reconnectAttempts: 0, lastReconnect: 0,
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
  loadMarket: async (symbol, timeframe, realtime = false) => {
    const data = await api<CandleFeed>(`/market/candles?${new URLSearchParams({ symbol, timeframe, realtime: realtime.toString() })}`);
    if (!Array.isArray(data.candles) || !data.candles.length) throw new Error('Provider tidak mengembalikan candle.');
    set({ feeds: { ...get().feeds, [`${symbol}:${timeframe}`]: { ...data, realtime: realtime } } }); return data;
  },
  setupRealtime: (symbol, timeframe) => {
    const key = `${symbol}:${timeframe}`;
    if (realtimeTimeouts[key] !== undefined) { clearTimeout(realtimeTimeouts[key]); }
    let attempts = 0;
    realtimeTimeouts[key] = setInterval(async () => {
      attempts++;
      try {
        await get().loadMarket(symbol, timeframe, true);
        set({ feeds: { ...get().feeds, [key]: { ...get().feeds[key], realtime: true } } });
        set({ reconnectAttempts: 0, lastReconnect: Date.now() });
      } catch (e) {
        const maxAttempts = 5;
        if (attempts >= maxAttempts) { realtimeTimeouts[key] = undefined; }
        const delay = Math.min(1000 * 2 ** attempts, 8000);
        set({ reconnectAttempts: attempts });
        await new Promise(r => setTimeout(r, delay));
      }
    }, 3000);
  },
  cleanupRealtime: () => {
    const keys = Object.keys(realtimeTimeouts);
    keys.forEach(key => { if (realtimeTimeouts[key] !== undefined) { clearTimeout(realtimeTimeouts[key]); } realtimeTimeouts[key] = undefined; });
    set({ reconnectAttempts: 0 });
  },
  login: async password => { await api('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }); await get().refresh(); },
  logout: async () => { await api('/auth/logout', { method: 'POST', body: '{}' }); set({ status: null, requiresLogin: true, broker: null, calendar: null, feeds: {}, draft: null, accountMode: 'local', realtime: false, reconnectAttempts: 0 }); for (const key of Object.keys(realtimeTimeouts)) { if (realtimeTimeouts[key] !== undefined) { clearTimeout(realtimeTimeouts[key]); } realtimeTimeouts[key] = undefined; } },
}), {
  name: 'monetasens.terminal.v2',
  storage: createJSONStorage(() => ({
    getItem: key => { try { return localStorage.getItem(key); } catch { return null; } },
    setItem: (key, value) => { try { localStorage.setItem(key, value); } catch { queueMicrotask(() => { if (!useTerminal.getState().storageError) useTerminal.setState({ storageError: true }); }); } },
    removeItem: key => { try { localStorage.removeItem(key); } catch { /* Session remains available. */ } },
  })),
  partialize: s => ({ calendar: s.calendar, broker: s.broker, feeds: s.feeds, accountMode: s.accountMode, selectedSymbol: s.selectedSymbol, timeframe: s.timeframe, captionTemplate: s.captionTemplate, newsWindow: s.newsWindow, realtime: s.realtime }),
}));