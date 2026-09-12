export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api${path}`, { ...init, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...init?.headers }, signal: init?.signal || AbortSignal.timeout(45000) }); }
  catch { throw new ApiError('Backend tidak terhubung. Data terakhir tetap tersedia secara offline.', 0); }
  let body: { error?: string };
  try { body = await response.json(); } catch { throw new ApiError('Respons backend tidak valid.', response.status); }
  if (!response.ok) throw new ApiError(body.error || `HTTP ${response.status}`, response.status);
  return body as T;
}
