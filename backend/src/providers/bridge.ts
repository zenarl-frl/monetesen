import type { ZodType } from 'zod';

export async function bridgeGet<T>(base: string, path: string, token: string, schema: ZodType<T>): Promise<T> {
  const url = new URL(`${base.replace(/\/$/, '')}${path}`);
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(12000), redirect: 'error' });
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
  return schema.parse(await response.json());
}
