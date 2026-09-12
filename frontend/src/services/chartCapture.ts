// In-memory only: canvas snapshots never enter localStorage.
let capture: (() => void) | null = null;
export function registerChartCapture(handler: () => void) { capture = handler; return () => { if (capture === handler) capture = null; }; }
export function captureActiveChart() { capture?.(); }
