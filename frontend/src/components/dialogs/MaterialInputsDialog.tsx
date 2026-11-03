/**
 * Read-only information for the selected standard material.
 * Display only stored Core properties. Custom entry and calculated material
 * properties are deferred; closing this dialog never changes the selected grade.
 */
import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { fetchMaterialProperties, type MaterialProperties } from '../../services/materialInputs';
import { DialogFrame } from './DialogFrame';
import { DialogField } from './DialogField';

export function MaterialInputsDialog() {
  const selection = useBridgeStore(s => s.materialDialog)!;
  const close = () => useBridgeStore.getState().setMaterialDialog(null);
  const [data, setData] = useState<MaterialProperties | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError('');
    fetchMaterialProperties(selection.member, selection.grade, controller.signal).then(properties => {
      if (!controller.signal.aborted) setData(properties);
    }).catch(error => {
      if (!controller.signal.aborted) setError(String(error));
    });
    return () => controller.abort();
  }, [selection, attempt]);

  return <DialogFrame title="Material Information" className="material-dialog" onClose={close}>
    <div className="additional-body material-body">
      {error && <div role="alert" className="additional-error">Could not load material properties. {error}
        <button type="button" className="osdag-btn-standard" onClick={() => setAttempt(value => value + 1)}>Retry</button>
      </div>}
      {!data ? !error && <p role="status">Loading material properties…</p> : <>
        <div className="additional-field"><label htmlFor="material-name">Material</label>
          <input id="material-name" className="osdag-input-field" value={data.material} readOnly />
        </div>
        {data.fields.map(field => <DialogField key={field.id} field={field} value={data.values[field.id!]}
          disabled onEdit={() => {}} />)}
      </>}
    </div>
    <footer className="material-footer">
      <span>Custom material entry is not available yet.</span>
      <button type="button" className="osdag-btn-standard" onClick={close}>OK</button>
    </footer>
  </DialogFrame>;
}
