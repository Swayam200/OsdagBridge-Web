/**
 * Read-only information for the selected standard material.
 * Values and field definitions come from the shared Core-backed catalogue.
 * Custom entry is deferred; closing never changes the selected grade.
 */
import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { materialPropertiesFor, type MaterialProperties } from '../../services/materialInputs';
import { DialogFrame } from './DialogFrame';
import { DialogField } from './DialogField';
import './material-inputs.css';

export function MaterialInputsDialog() {
  const selection = useBridgeStore(s => s.materialDialog)!;
  const constants = useBridgeStore(s => s.constants);
  const fetchCatalogue = useBridgeStore(s => s.fetchMaterialCatalogue);
  const close = () => useBridgeStore.getState().setMaterialDialog(null);
  const [data, setData] = useState<MaterialProperties | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setData(null);
    setError('');
    if (!constants) return;
    let active = true;
    fetchCatalogue(attempt > 0).then(catalogue => {
      const properties = materialPropertiesFor(catalogue, selection.member, selection.grade, constants);
      if (active) setData(properties);
    }).catch(error => {
      if (active) setError(String(error));
    });
    return () => { active = false; };
  }, [selection.member, selection.grade, constants, fetchCatalogue, attempt]);

  return <DialogFrame title="Material Information" className="material-dialog" onClose={close}>
    <div className="additional-body material-body">
      {error && <div role="alert" className="additional-error">Could not load material properties. {error}
        <button type="button" className="osdag-btn-standard" onClick={() => setAttempt(value => value + 1)}>Retry</button>
      </div>}
      {!data ? !error && <p role="status">Loading material properties…</p> : <>
        <div className="additional-field"><label htmlFor="material-name">Material</label>
          <input id="material-name" className="osdag-input-field" value={data.material} readOnly />
        </div>
        {data.fields.map(field => <DialogField key={field.id} field={field} value={data.values[field.id!]} />)}
      </>}
    </div>
    <footer className="material-footer">
      <button type="button" className="osdag-btn-standard" onClick={close}>OK</button>
    </footer>
  </DialogFrame>;
}
