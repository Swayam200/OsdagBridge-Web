/**
 * Typical Section layout from Core's existing schema endpoint.
 * Fields and Save/Defaults stay disabled until Core evaluation is connected.
 * No defaults, calculations or validation results are fabricated in the browser.
 */
import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../../store/useBridgeStore';
import { fetchAdditionalInputsSchema } from '../../../services/api';
import type { AdditionalTab, TypicalField } from '../../../types/additionalInputs';
import { DialogFrame } from '../DialogFrame';
import { DialogField } from '../DialogField';

export function AdditionalInputsDialog() {
  const close = useBridgeStore(s => s.setAdditionalInputsOpen);
  const inputs = useBridgeStore(s => s.inputs);
  const [tabs, setTabs] = useState<AdditionalTab[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetchAdditionalInputsSchema(controller.signal).then(value => {
      if (!controller.signal.aborted) setTabs(value);
    }).catch(error => {
      if (!controller.signal.aborted) setError(String(error));
    });
    // Closing or retrying must not accept a response from the previous request.
    return () => controller.abort();
  }, [attempt]);

  const typical = tabs[0]?.schema;
  const subtab = typical?.tabs?.[active];
  const renderFields = (rows: { fields: TypicalField[] }[] = []) => rows.map((row, index) =>
    <div key={index} className="additional-row">{row.fields
      .filter(field => field.id && ['textbox', 'combobox'].includes(field.type ?? ''))
      .map(field => <DialogField key={field.id} field={field} value={inputs[field.id!]} />)}
    </div>);

  return <DialogFrame title="Additional Inputs" onClose={() => close(false)}>
    <div className="additional-body">
      <p role="status">Input editing and calculations are not available yet.</p>
      <div className="additional-tabs" role="tablist" aria-label="Additional input groups">
        {tabs.map((tab, index) => <button key={tab.main_id} type="button" role="tab" aria-selected={index === 0}
          disabled={index !== 0} className={index === 0 ? 'selected' : ''}>{tab.label}</button>)}
      </div>
      {error ? <div role="alert" className="additional-error">Could not load inputs. {error}
        <button type="button" className="osdag-btn-standard" onClick={() => setAttempt(value => value + 1)}>Retry</button>
      </div> : !typical ? <p role="status">Loading inputs…</p> :
        <div className="additional-panel" role="tabpanel" aria-label="Typical Section Details">
          {renderFields(typical.primary_fields?.rows)}
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
              aria-selected={index === active} tabIndex={index === active ? 0 : -1} aria-controls="additional-subtab"
              disabled={tab.disable} className={index === active ? 'selected' : ''}
              onClick={() => setActive(index)}>{tab.label}</button>)}
          </div>
          <div id="additional-subtab" role="tabpanel" aria-labelledby={`tab-${subtab?.id}`} className="additional-subtab">
            {renderFields(subtab?.rows)}
          </div>
        </div>}
    </div>
    <footer className="additional-footer">
      <span />
      <button type="button" className="osdag-btn-standard" disabled>Defaults</button>
      <button type="button" className="osdag-btn-standard" disabled>Save</button>
    </footer>
  </DialogFrame>;
}
