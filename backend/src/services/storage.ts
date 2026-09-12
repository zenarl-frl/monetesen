import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { snapshotSchema, type DispatchRecord, type Snapshot } from '../contracts.js';

type State = { snapshot: Snapshot | null; dispatches: DispatchRecord[] };
export class Storage {
  private state: State = { snapshot: null, dispatches: [] };
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private file: string | null) {}
  async init() {
    if (!this.file) return;
    try {
      const raw = JSON.parse(await readFile(this.file, 'utf8'));
      const parsed = z.object({ snapshot: snapshotSchema.nullable(), dispatches: z.array(z.object({ id: z.string(), symbol: z.string(), status: z.enum(['pending', 'sent', 'failed', 'unknown', 'partial']), at: z.string(), messageIds: z.array(z.number()), error: z.string().optional() })) }).parse(raw);
      this.state = parsed;
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('Workspace data is invalid or unreadable. Back up and repair the data file.'); }
  }
  read(): State { return structuredClone(this.state); }
  update(fn: (state: State) => void): Promise<void> {
    const task = this.queue.then(async () => {
      const next = structuredClone(this.state); fn(next);
      if (this.file) {
        await mkdir(dirname(this.file), { recursive: true });
        await writeFile(`${this.file}.tmp`, JSON.stringify(next), { mode: 0o600 });
        await rename(`${this.file}.tmp`, this.file);
      }
      this.state = next;
    });
    this.queue = task.catch(() => {});
    return task;
  }
}
