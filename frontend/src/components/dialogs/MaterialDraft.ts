/**
 * Isolated custom-material draft. Serializes edits so E/G/Poisson linkage uses
 * the latest evaluated values, and flushes edits before Add validates/commits.
 * Failed requests retain their edits for Retry; close ignores late responses.
 */
import type { MaterialEvaluation } from '../../services/materialInputs';
import type { InputValues, TypicalIssue } from '../../services/typicalSection';

export interface MaterialDraftState extends MaterialEvaluation {
  pending: number;
  action: 'add' | 'retry' | null;
  error: string;
}
type Evaluate = (values: InputValues, changedKey?: string, validateAll?: boolean) => Promise<MaterialEvaluation>;

export class MaterialDraft {
  private edits: { key: string; value: unknown }[] = [];
  private queue = Promise.resolve();
  private pending = 0;
  private action: MaterialDraftState['action'] = null;
  private error = '';
  private closed = false;

  constructor(
    private result: MaterialEvaluation,
    private evaluate: Evaluate,
    private publish: (state: MaterialDraftState) => void,
    private commit: (result: MaterialEvaluation) => boolean,
  ) {
    this.emit();
  }
  private emit() {
    // Keep newer raw edits visible while an earlier response is still pending.
    if (!this.closed) this.publish({
      ...this.result,
      values: { ...this.result.values, ...Object.fromEntries(this.edits.map(edit => [edit.key, edit.value])) },
      pending: this.pending,
      action: this.action,
      error: this.error,
    });
  }
  private enqueue(work: () => Promise<void>) {
    this.pending++;
    this.emit();
    this.queue = this.queue.then(async () => {
      if (this.closed) return;
      try {
        await work();
        if (!this.closed) this.error = '';
      } catch (error) {
        if (!this.closed) this.error = error instanceof Error ? error.message : 'Unable to check material properties.';
      } finally {
        this.pending--;
        this.emit();
      }
    });
    return this.queue;
  }
  private async flush() {
    while (this.edits.length) {
      const edit = this.edits[0];
      const result = await this.evaluate({ ...this.result.values, [edit.key]: edit.value }, edit.key);
      if (this.closed) return;
      this.result = result;
      // Remove only after success, preserving replay order if a request fails.
      this.edits.shift();
    }
  }
  edit(key: string, value: unknown) {
    if (this.closed || this.action) return this.queue;
    this.edits.push({ key, value });
    if (this.error) {
      this.emit();
      return this.queue;
    }
    return this.enqueue(() => this.flush());
  }
  retry() {
    if (this.closed || this.action) return this.queue;
    this.action = 'retry';
    return this.enqueue(async () => {
      try {
        await this.flush();
      } finally {
        this.action = null;
      }
    });
  }
  add() {
    if (this.closed || this.action) return this.queue;
    this.action = 'add';
    return this.enqueue(async () => {
      try {
        if (this.error) throw new Error('Retry checking the material properties before adding.');
        await this.flush();
        if (this.closed) return;
        // Add always validates the complete draft before publishing it to the store.
        const result = await this.evaluate(this.result.values, undefined, true);
        if (this.closed) return;
        this.result = result;
        if (!result.issues.length && !this.commit(result)) throw new Error('The material selection changed or inputs were locked. Close and reopen this dialog.');
      } finally {
        this.action = null;
      }
    });
  }
  correct(issue: TypicalIssue) { return this.edit(issue.key, issue.corrected_value); }
  close() { this.closed = true; }
}
