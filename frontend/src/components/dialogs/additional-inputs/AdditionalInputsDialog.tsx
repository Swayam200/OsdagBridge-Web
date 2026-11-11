/**
 * Read-only Desktop-style Additional Inputs. Schema supplies the controls and
 * help text. Opening and navigating the preview never evaluates or saves inputs.
 */
import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../../store/useBridgeStore';
import { fetchAdditionalInputsSchema } from '../../../services/api';
import type { AdditionalTab, TypicalField } from '../../../services/typicalSection';
import { DialogFrame } from '../DialogFrame';
import { DialogField } from '../DialogField';
import { AdditionalTabs } from './AdditionalTabs';
import { ReadOnlyAdditionalPanel } from './ReadOnlyAdditionalPanel';
import { StaticInputDiagram } from './StaticInputDiagram';

export function AdditionalInputsDialog() {
  const close = useBridgeStore(s => s.setAdditionalInputsOpen);
  const inputs = useBridgeStore(s => s.inputs);
  const constants = useBridgeStore(s => s.constants);
  const [tabs, setTabs] = useState<AdditionalTab[]>([]);
  const [activeGroup, setActiveGroup] = useState(0);
  const [active, setActive] = useState(0);
  const [schemaError, setSchemaError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Each opening owns its request; closing or retrying ignores late responses.
    const controller = new AbortController();
    setSchemaError('');
    fetchAdditionalInputsSchema(controller.signal).then(tabs => {
      if (!controller.signal.aborted) setTabs(tabs);
    }).catch(error => {
      if (!controller.signal.aborted) setSchemaError(String(error));
    });
    return () => controller.abort();
  }, [attempt]);

  const group = tabs[activeGroup];
  const typical = tabs[0]?.schema;
  const primaryFields = typical?.primary_fields;
  const subtab = typical?.tabs?.[active];
  const disabled = new Set<string>();
  // Desktop's tab availability follows the Basic Inputs even in this read-only view.
  if (constants) {
    const { KEY_INCLUDE_MEDIAN, KEY_FOOTPATH, KEY_MD_TAB, KEY_RL_TAB } = constants;
    const footpath = inputs[String(KEY_FOOTPATH)];
    if (typeof KEY_MD_TAB === 'string' && inputs[String(KEY_INCLUDE_MEDIAN)] !== 'Yes') {
      disabled.add(KEY_MD_TAB);
    }
    if (typeof KEY_RL_TAB === 'string' && footpath !== 'Single Side' && footpath !== 'Both Sides') {
      disabled.add(KEY_RL_TAB);
    }
  }
  const renderFields = (rows: { fields: TypicalField[] }[] = []) => rows.map((row, index) =>
    <div key={index} className="additional-row">{row.fields
      .filter(field => field.id && ['textbox', 'combobox'].includes(field.type ?? ''))
      .map(field => <DialogField key={field.id} field={field} value={inputs[field.id!] ?? field.default} />)}
    </div>);

  return <DialogFrame title="Additional Inputs" onClose={() => close(false)}>
    <div className="additional-body additional-section-body">
      <AdditionalTabs tabs={tabs.map(tab => ({ label: tab.label }))}
        active={activeGroup} onSelect={setActiveGroup} panelId="additional-group-panel"
        label="Additional input groups" className="additional-group-tabs" />
      {schemaError && <div role="alert" className="additional-error">Could not load inputs. {schemaError}
        <button type="button" className="osdag-btn-standard" onClick={() => setAttempt(value => value + 1)}>Retry</button>
      </div>}
      {!group ? !schemaError && <p role="status">Loading inputs…</p> : activeGroup !== 0
        ? <ReadOnlyAdditionalPanel key={group.main_id} schema={group.schema} values={inputs}
            label={group.label} labelledBy={`additional-group-panel-tab-${activeGroup}`} />
        : <div id="additional-group-panel" className="additional-panel" role="tabpanel"
            aria-labelledby="additional-group-panel-tab-0">
          <div className="additional-typical-reference"><StaticInputDiagram diagram="typical" /></div>
          <section className="additional-primary-fields" aria-labelledby="additional-primary-title"
            style={{ '--dialog-label-width': `${primaryFields?.label_width ?? 200}px` } as React.CSSProperties}>
            <h3 id="additional-primary-title">Inputs:</h3>
            {renderFields(primaryFields?.rows)}
          </section>
          <AdditionalTabs tabs={typical.tabs?.map(tab => ({ label: tab.label ?? '',
            disabled: tab.disable || disabled.has(tab.id) })) ?? []}
            active={active} onSelect={setActive} panelId="additional-subtab" label="Typical Section subtabs" />
          <div id="additional-subtab" role="tabpanel" aria-labelledby={`additional-subtab-tab-${active}`} className="additional-subtab"
            style={{ '--dialog-label-width': `${subtab?.label_width ?? 200}px`, paddingTop: subtab?.top_margin ?? 6 } as React.CSSProperties}>
            {renderFields(subtab?.rows)}
          </div>
        </div>}
    </div>
    <footer className="additional-footer">
      <button type="button" className="osdag-btn-standard" disabled>Defaults</button>
      <button type="button" className="osdag-btn-standard" disabled>Save</button>
    </footer>
  </DialogFrame>;
}
