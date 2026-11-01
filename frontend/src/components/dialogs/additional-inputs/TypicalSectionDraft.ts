/**
 * Draft lifecycle for one Additional Inputs opening. Edits are evaluated in order
 * without touching shared inputs. Save commits and updates the Defaults baseline;
 * close discards later edits and ignores responses still in flight.
 */
import type { EvaluateTypical, InputValues, TypicalEvaluation } from '../../../services/typicalSection';

export interface DraftState {
  values: InputValues;
  evaluation: TypicalEvaluation | null;
  pending: number;
  action: 'save' | 'defaults' | 'retry' | null;
  error: string;
}

/** Serializes dependent edits without exposing an unsaved draft to shared inputs. */
export class TypicalSectionDraft {
  private values: InputValues = {};
  private baseline: InputValues = {};
  // Solver failures can restore the last valid layout after user acknowledgment.
  private lastGood: InputValues = {};
  private evaluation: TypicalEvaluation | null = null;
  private raw = new Map<string, { value: unknown; revision: number }>();
  private failedEdits: { key: string; value: unknown }[] = [];
  private retryBase: InputValues = {};
  private queue = Promise.resolve();
  private revision = 0;
  private pending = 0;
  private action: DraftState['action'] = null;
  private error = '';
  private closed = false;

  constructor(
    private context: InputValues,
    private evaluate: EvaluateTypical,
    private publish: (state: DraftState) => void,
    private commit: (values: InputValues) => boolean,
  ) {}

  private accept(result: TypicalEvaluation) {
    // Keep an adjustment notice through unrelated edits/Save until layout changes.
    const sameLayout = ['no_of_girders', 'girder_spacing', 'deck_overhang', 'overall_bridge_width']
      .every(name => result.values[`typical_section.${name}`] === this.evaluation?.values[`typical_section.${name}`]);
    const notices = result.notices.length ? result.notices : sameLayout ? this.evaluation?.notices ?? [] : [];
    this.values = { ...result.values };
    this.evaluation = {
      ...result,
      notices,
      issues: result.issues.map(issue => {
        const restoreLayout = issue.corrected_value == null && typeof result.values[issue.key] === 'number'
          && ['typical_section.no_of_girders', 'typical_section.girder_spacing'].includes(issue.key)
          && this.lastGood[issue.key] != null;
        return { ...issue, restoreLayout, corrected_value: restoreLayout ? this.lastGood[issue.key] : issue.corrected_value };
      }),
    };
    if (!result.issues.length) this.lastGood = { ...result.values };
  }

  private emit() {
    // Overlay revisions not yet evaluated so earlier responses cannot hide typing.
    if (!this.closed) this.publish({
      values: { ...this.values, ...Object.fromEntries([...this.raw].map(([key, edit]) => [key, edit.value])) },
      evaluation: this.evaluation,
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
        if (!this.closed) this.error = error instanceof Error ? error.message : 'Unable to check inputs. Please retry.';
      } finally {
        this.pending--;
        this.emit();
      }
    });
    return this.queue;
  }

  initialize() {
    return this.enqueue(async () => {
      const result = await this.evaluate(this.context);
      if (this.closed) return;
      this.accept(result);
      this.baseline = { ...result.values };
    });
  }

  edit(key: string, value: unknown) {
    if (this.closed || this.action) return this.queue;
    const revision = ++this.revision;
    this.raw.set(key, { value, revision });
    return this.enqueue(async () => {
      const previous = this.values;
      this.values = { ...this.values, [key]: value };
      if (this.failedEdits.length) {
        // Later edits depend on the failed edit and must be replayed after it.
        this.failedEdits.push({ key, value });
        throw new Error('Some edits could not be checked. Retry to check them in order.');
      }
      let result: TypicalEvaluation;
      try {
        result = await this.evaluate({ ...this.context, ...this.values }, key);
      } catch (error) {
        this.retryBase = { ...previous };
        this.failedEdits.push({ key, value });
        throw error;
      }
      if (this.closed) return;
      this.accept(result);
      for (const [field, edit] of this.raw) if (edit.revision <= revision) this.raw.delete(field);
    });
  }

  save() {
    if (this.closed || this.action) return this.queue;
    this.action = 'save';
    return this.enqueue(async () => {
      try {
        if (this.failedEdits.length) throw new Error('Some edits could not be checked. Retry before saving.');
        const result = await this.evaluate({ ...this.context, ...this.values }, undefined, true);
        if (this.closed) return;
        this.accept(result);
        this.raw.clear();
        if (!result.issues.length) {
          if (!this.commit(result.values)) throw new Error('Basic Inputs changed or were locked. Close and reopen this dialog.');
          this.baseline = { ...result.values };
        }
      } finally {
        this.action = null;
      }
    });
  }

  defaults() {
    if (this.closed || this.action) return this.queue;
    this.action = 'defaults';
    return this.enqueue(async () => {
      try {
        // Desktop Defaults restores the whole opening/latest-Save baseline.
        const result = await this.evaluate({ ...this.context, ...this.baseline });
        if (this.closed) return;
        this.accept(result);
        this.raw.clear();
        this.failedEdits = [];
      } finally {
        this.action = null;
      }
    });
  }

  retry() {
    if (this.closed || this.action) return this.queue;
    if (!this.evaluation) return this.initialize();
    this.action = 'retry';
    return this.enqueue(async () => {
      try {
        // Re-evaluate failed edits in order to recover their dependent values.
        while (this.failedEdits.length) {
          const edit = this.failedEdits[0];
          const checked = await this.evaluate({ ...this.context, ...this.retryBase, [edit.key]: edit.value }, edit.key);
          if (this.closed) return;
          this.retryBase = checked.values;
          this.failedEdits.shift();
          this.accept(checked);
        }
        const result = await this.evaluate({ ...this.context, ...this.values }, undefined, true);
        if (this.closed) return;
        this.accept(result);
        this.raw.clear();
      } finally {
        this.action = null;
      }
    });
  }

  correct(issue: import('../../../services/typicalSection').TypicalIssue) {
    if (!issue.restoreLayout) return this.edit(issue.key, issue.corrected_value);
    // Restore all four layout fields together; restoring count alone could lose
    // a valid spacing the user had deliberately chosen before the failed edit.
    const layout = Object.fromEntries(['no_of_girders', 'girder_spacing', 'deck_overhang', 'overall_bridge_width']
      .map(name => [`typical_section.${name}`, this.lastGood[`typical_section.${name}`]]));
    return this.enqueue(async () => {
      const result = await this.evaluate({ ...this.context, ...this.values, ...layout }, 'typical_section.girder_spacing');
      if (!this.closed) {
        this.accept(result);
        for (const key of Object.keys(layout)) this.raw.delete(key);
      }
    });
  }

  close() { this.closed = true; }
}
