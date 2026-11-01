/**
 * Schema-driven Typical Section group of Desktop's Additional Inputs dialog.
 * Other groups and Lane Details stay disabled. A per-opening draft handles
 * Save/Defaults/discard; the API supplies values, validation and control states.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../../store/useBridgeStore';
import { fetchAdditionalInputsSchema } from '../../../services/api';
import { typicalEvaluator, type AdditionalTab, type TypicalField, type TypicalIssue } from '../../../services/typicalSection';
import { TypicalSectionDraft, type DraftState } from './TypicalSectionDraft';
import { DialogFrame } from '../DialogFrame';
import { DialogField } from '../DialogField';

const initialState: DraftState = { values: {}, evaluation: null, pending: 0, action: null, error: '' };

export function AdditionalInputsDialog() {
  const close = useBridgeStore(s => s.setAdditionalInputsOpen);
  const locked = useBridgeStore(s => s.isLocked);
  const [tabs, setTabs] = useState<AdditionalTab[]>([]);
  const [active, setActive] = useState(0);
  const [state, setState] = useState(initialState);
  const [warning, setWarning] = useState<TypicalIssue | null>(null);
  const [saved, setSaved] = useState(false);
  const [schemaError, setSchemaError] = useState('');
  const session = useRef<TypicalSectionDraft | null>(null);
  const requests = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    requests.current = controller;
    let context = useBridgeStore.getState().inputs;
    const draft = new TypicalSectionDraft(context, typicalEvaluator(controller.signal), setState, values => {
      const store = useBridgeStore.getState();
      // Commit only into the same input snapshot; rebase this guard after Save.
      if (store.inputs !== context || store.isLocked) return false;
      store.patchInputs(values);
      context = useBridgeStore.getState().inputs;
      setSaved(true);
      return true;
    });
    session.current = draft;
    // Schema and initial evaluation are independent; render when both are ready.
    fetchAdditionalInputsSchema(controller.signal).then(setTabs).catch(error => {
      if (!controller.signal.aborted) setSchemaError(String(error));
    });
    void draft.initialize();
    return () => {
      draft.close();
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const issue = state.evaluation?.issues[0];
    if (!issue) return;
    if (issue.key.startsWith('typical_section.')) setWarning(issue);
    else {
      // Basic geometry errors belong to the existing dock-level error dialog.
      close(false);
      useBridgeStore.getState().showInputErrorDialog(issue.message, () => {
        if (issue.corrected_value != null) useBridgeStore.getState().updateField(issue.key, issue.corrected_value);
      });
    }
  }, [state.evaluation, close]);

  const evaluation = state.evaluation;
  const typical = tabs[0]?.schema;
  const subtab = typical?.tabs?.[active];
  const disabled = new Set(evaluation?.disabled);
  const hidden = new Set(evaluation?.hidden);
  const editingDisabled = locked || !!state.action || !!warning;
  const edit = (key: string, value: string) => {
    setSaved(false);
    void session.current?.edit(key, value);
  };
  // Preserve Core's paired rows, filtering controls using evaluated visibility.
  const renderFields = (rows: { fields: TypicalField[] }[] = []) => rows.map((row, index) => <div key={index} className="additional-row">{row.fields
    .filter(field => field.id && ['textbox', 'combobox'].includes(field.type ?? '') && !hidden.has(field.id))
    .map(field => <DialogField key={field.id} field={field} value={state.values[field.id!]}
      disabled={editingDisabled || !!field.read_only || disabled.has(field.id!)}
      error={evaluation?.issues.find(issue => issue.key === field.id)?.message} onEdit={edit} />)}</div>);
  const ready = !!evaluation && !!typical;
  const error = state.error || schemaError;

  return <DialogFrame title="Additional Inputs" onClose={() => close(false)} dismissWarning={() => setWarning(null)}
    warning={warning && { message: warning.message, onOk: () => {
      if (warning.corrected_value != null && warning.key.startsWith('typical_section.') && !locked)
        void session.current?.correct(warning);
      setWarning(null);
    } }}>
    <div className="additional-body">
      <div className="additional-tabs" role="tablist" aria-label="Additional input groups">
        {tabs.map((tab, index) => <button key={tab.main_id} type="button" role="tab" aria-selected={index === 0}
          disabled={index !== 0} className={index === 0 ? 'selected' : ''}>{tab.label}</button>)}
      </div>
      {error && <div role="alert" className="additional-error">Could not check inputs. {error}
        <button type="button" className="osdag-btn-standard" disabled={!!state.action} onClick={() => {
          const signal = requests.current?.signal;
          if (schemaError) fetchAdditionalInputsSchema(signal).then(value => {
            if (!signal?.aborted) { setTabs(value); setSchemaError(''); }
          }).catch(error => { if (!signal?.aborted) setSchemaError(String(error)); });
          void session.current?.retry();
        }}>Retry</button>
      </div>}
      {!ready ? <p role="status">Loading inputs…</p> : <div className="additional-panel" role="tabpanel" aria-label="Typical Section Details">
        {renderFields(typical.primary_fields?.rows)}
        {evaluation.notices.map(notice => <p key={notice} className="additional-notice" role="status">{notice}</p>)}
        <div className="additional-tabs" role="tablist" aria-label="Typical Section subtabs" onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
          event.preventDefault();
          buttons[next]?.focus();
          buttons[next]?.click();
        }}>
          {typical.tabs?.map((tab, index) => <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab"
            aria-selected={index === active} tabIndex={index === active ? 0 : -1} aria-controls="additional-subtab" disabled={tab.disable || disabled.has(tab.id) || !!warning}
            className={index === active ? 'selected' : ''} onClick={() => setActive(index)}>{tab.label}</button>)}
        </div>
        <div id="additional-subtab" role="tabpanel" aria-labelledby={`tab-${subtab?.id}`} className="additional-subtab">
          {renderFields(subtab?.rows)}
        </div>
      </div>}
    </div>
    <footer className="additional-footer">
      <span role="status">{state.pending ? 'Checking inputs…' : saved ? 'Inputs saved successfully.' : locked ? 'Unlock to edit.' : ''}</span>
      <button type="button" className="osdag-btn-standard" disabled={!ready || editingDisabled}
        onClick={() => { setSaved(false); void session.current?.defaults(); }}>Defaults</button>
      <button type="button" className="osdag-btn-standard" disabled={!ready || editingDisabled || !!error}
        onClick={() => void session.current?.save()}>{state.action === 'save' ? 'Saving…' : 'Save'}</button>
    </footer>
  </DialogFrame>;
}
