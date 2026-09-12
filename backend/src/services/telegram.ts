import type { Config } from '../config.js';
import type { DispatchInput, DispatchRecord } from '../contracts.js';
import type { Storage } from './storage.js';

export class TelegramService {
  constructor(private config: Config, private storage: Storage) {}
  async dispatch(input: DispatchInput): Promise<DispatchRecord> {
    if (!this.config.TELEGRAM_BOT_TOKEN || !this.config.TELEGRAM_CHAT_ID) throw new Error('Telegram belum dikonfigurasi di backend.');
    let duplicate: DispatchRecord | undefined;
    await this.storage.update(state => {
      duplicate = state.dispatches.find(d => d.id === input.requestId);
      if (!duplicate) state.dispatches.unshift({ id: input.requestId, symbol: input.symbol, status: 'pending', at: new Date().toISOString(), messageIds: [] });
    });
    if (duplicate) return duplicate;
    const record = this.storage.read().dispatches.find(d => d.id === input.requestId)!;
    try {
      if (input.image) {
        const bytes = Buffer.from(input.image.split(',')[1], 'base64');
        if (bytes.length > 5_000_000 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new TelegramRejected('Invalid PNG image.');
        const form = new FormData();
        form.set('chat_id', this.config.TELEGRAM_CHAT_ID);
        form.set('photo', new Blob([bytes], { type: 'image/png' }), 'monetasens-chart.png');
        form.set('caption', input.caption.length <= 1024 ? input.caption : `${input.symbol} · ${input.side}\nFull setup follows.`);
        record.messageIds.push(await this.send('sendPhoto', { body: form }));
        // Persist an accepted photo before the optional text call, avoiding photo retries.
        await this.storage.update(s => { Object.assign(s.dispatches.find(d => d.id === record.id)!, record); });
      }
      if (!input.image || input.caption.length > 1024) {
        record.messageIds.push(await this.send('sendMessage', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: this.config.TELEGRAM_CHAT_ID, text: input.caption }) }));
      }
      record.status = 'sent';
    } catch (error) {
      record.status = record.messageIds.length ? 'partial' : error instanceof TelegramRejected ? 'failed' : 'unknown';
      record.error = record.status === 'unknown' ? 'Hasil pengiriman belum dapat dipastikan. Periksa channel sebelum membuat pengiriman baru.' : record.status === 'partial' ? 'Gambar terkirim, caption lanjutan gagal. Periksa channel.' : 'Telegram menolak pengiriman. Periksa konfigurasi bot, channel, dan gambar.';
    }
    await this.storage.update(s => { Object.assign(s.dispatches.find(d => d.id === record.id)!, record); });
    return record;
  }
  private async send(method: string, init: RequestInit): Promise<number> {
    const response = await fetch(`https://api.telegram.org/bot${this.config.TELEGRAM_BOT_TOKEN}/${method}`, { ...init, method: 'POST', signal: AbortSignal.timeout(20000), redirect: 'error' });
    const body = await response.json() as { ok: boolean; result?: { message_id: number } };
    if (!response.ok || !body.ok || !body.result?.message_id) throw new TelegramRejected('Telegram rejected request.');
    return body.result.message_id;
  }
}
class TelegramRejected extends Error {}
