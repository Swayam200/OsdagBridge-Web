/**
 * Desktop-style Material Information and Enter Custom Properties dialogs.
 * Standard/existing custom information is read-only; a new Custom draft reaches
 * shared inputs only on Add. Closing otherwise keeps the previous grade intact.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { fetchMaterialProperties, materialEvaluator, memberValues, type MaterialProperties } from '../../services/materialInputs';
import type { TypicalIssue } from '../../services/typicalSection';
import { DialogFrame } from './DialogFrame';
import { DialogField } from './DialogField';
import { MaterialDraft, type MaterialDraftState } from './MaterialDraft';

export function MaterialInputsDialog() {
  const selection = useBridgeStore(s => s.materialDialog)!;
  const locked = useBridgeStore(s => s.isLocked);
  const close = () => useBridgeStore.getState().setMaterialDialog(null);
  const [data, setData] = useState<MaterialProperties | null>(null);
  const [state, setState] = useState<MaterialDraftState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [warning, setWarning] = useState<TypicalIssue | null>(null);
  const draft = useRef<MaterialDraft | null>(null);
  const readOnly = !selection.custom;

  useEffect(() => {
    const controller = new AbortController();
    const { member, grade, custom } = selection;
    const existing = useBridgeStore.getState().customMaterials[grade];
    setLoadError('');
    // Existing session grades reuse Core's field definitions but supply their
    // saved values from the shared registry under this member's key prefix.
    fetchMaterialProperties(member, custom || existing ? 'Custom' : grade, controller.signal).then(properties => {
      if (controller.signal.aborted) return;
      if (!custom && existing) properties = { ...properties, material: grade, values: memberValues(member, existing) };
      setData(properties);
      draft.current = new MaterialDraft({ material: properties.material, values: properties.values, issues: [] },
        materialEvaluator(member, controller.signal), setState, result => {
          const store = useBridgeStore.getState();
          // A delayed Add cannot replace a different selection or locked inputs.
          if (store.isLocked || store.materialDialog !== selection || String(store.inputs[member] ?? '') !== grade) return false;
          store.addCustomMaterial(member, result.material, result.values);
          return true;
        });
    }).catch(error => { if (!controller.signal.aborted) setLoadError(String(error)); });
    return () => {
      controller.abort();
      draft.current?.close();
    };
  }, [selection, attempt]);
  useEffect(() => { if (state?.issues.length) setWarning(state.issues[0]); }, [state?.issues]);

  const error = loadError || state?.error;
  const disabled = readOnly || locked || !!state?.action || !!warning;
  return <DialogFrame title={readOnly ? 'Material Information' : 'Enter Custom Properties'} className="material-dialog"
    onClose={close} dismissWarning={() => setWarning(null)}
    warning={warning && { message: warning.message, onOk: () => {
      if (warning.corrected_value != null && !locked) void draft.current?.correct(warning);
      setWarning(null);
    } }}>
    <div className="additional-body material-body">
      {error && <div role="alert" className="additional-error">Could not load or check material properties. {error}
        <button type="button" className="osdag-btn-standard" disabled={!!state?.action} onClick={() => {
          if (loadError) setAttempt(value => value + 1); else void draft.current?.retry();
        }}>Retry</button>
      </div>}
      {!data || !state ? <p role="status">Loading material properties…</p> : <>
        <div className="additional-field"><label htmlFor="material-name">Material</label>
          <input id="material-name" className="osdag-input-field" value={state.material} readOnly />
        </div>
        {data.fields.map(field => <DialogField key={field.id} field={field} value={state.values[field.id!]} disabled={disabled}
          error={state.issues.find(issue => issue.key === field.id)?.message}
          onEdit={(key, value) => { void draft.current?.edit(key, value); }} />)}
      </>}
    </div>
    <footer className="material-footer">
      <span role="status">{state?.pending ? 'Checking properties…' : locked && !readOnly ? 'Unlock to edit.' : ''}</span>
      {readOnly ? <button type="button" className="osdag-btn-standard" onClick={close}>OK</button> : <>
        <button type="button" className="osdag-btn-standard" disabled={!state || disabled || !!error} onClick={() => void draft.current?.add()}>
          {state?.action === 'add' ? 'Adding…' : 'Add'}</button>
        <button type="button" className="osdag-btn-standard" onClick={close}>Cancel</button>
      </>}
    </footer>
  </DialogFrame>;
}
