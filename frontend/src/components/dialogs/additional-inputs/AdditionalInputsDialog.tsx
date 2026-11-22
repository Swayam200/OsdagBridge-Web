import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../../store/useBridgeStore';
import { fetchAdditionalInputsSchema } from '../../../services/api';
import { evaluateTypicalSection, type AdditionalTab, type TypicalEdit, type TypicalRows, type TypicalSectionValues } from '../../../services/typicalSection';
import { DialogFrame } from '../DialogFrame';
import { DialogField } from '../DialogField';
import { AdditionalTabs } from './AdditionalTabs';
import { ReadOnlyAdditionalPanel } from './ReadOnlyAdditionalPanel';
import { StaticInputDiagram } from './StaticInputDiagram';

export function AdditionalInputsDialog() {
  const close = useBridgeStore(s => s.setAdditionalInputsOpen);
  const saveTypicalSection = useBridgeStore(s => s.saveTypicalSection);
  const constants = useBridgeStore(s => s.constants);
  const [snapshot] = useState(() => ({ ...useBridgeStore.getState().inputs }));
  const [savedEdits] = useState(() => {
    const saved = useBridgeStore.getState().savedTypicalSection;
    return saved?.basicInputs === JSON.stringify(snapshot) ? saved.edits : [];
  });
  const edits = useRef(savedEdits);
  const request = useRef<AbortController | null>(null);
  const pending = useRef<Promise<void>>(Promise.resolve());
  const rejectedKey = useRef<string | null>(null);
  const [groups, setGroups] = useState<AdditionalTab[]>([]);
  const [activeGroup, setActiveGroup] = useState(0);
  const [data, setData] = useState<TypicalSectionValues>();
  const [active, setActive] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [schemaError, setSchemaError] = useState('');
  const [schemaAttempt, setSchemaAttempt] = useState(0);
  const [editError, setEditError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setSchemaError('');
    void fetchAdditionalInputsSchema(controller.signal).then(tabs => {
      if (!controller.signal.aborted) setGroups(tabs);
    }).catch(error => {
      if (!controller.signal.aborted) setSchemaError(String(error));
    });
    return () => controller.abort();
  }, [schemaAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    setLoadError('');
    void evaluateTypicalSection(snapshot, edits.current, controller.signal).then(section => {
      if (!controller.signal.aborted) setData(section);
    }).catch(error => {
      if (!controller.signal.aborted) setLoadError(error.message);
    });
    return () => controller.abort();
  }, [attempt, snapshot]);

  const group = groups[activeGroup];
  const typical = group?.schema.id === constants?.KEY_TS_TAB ? group?.schema : undefined;

  function applyEdit(key: string, value: string) {
    const signal = request.current?.signal;
    if (!signal || signal.aborted) return;
    // Serialize edits so a second field uses the last accepted layout.
    setValidating(true);
    const next = pending.current.then(async () => {
      if (signal.aborted) return;
      const candidate = [...edits.current, { key, value }];
      try {
        const section = await evaluateTypicalSection(snapshot, candidate, signal);
        if (signal.aborted) return;
        edits.current = candidate;
        setData(section);
        if (rejectedKey.current === key) {
          rejectedKey.current = null;
          setEditError('');
        }
      } catch (error) {
        if (!signal.aborted) {
          rejectedKey.current = key;
          setEditError(String(error));
        }
      }
    });
    pending.current = next;
    void next.then(() => {
      if (pending.current === next && !signal.aborted) setValidating(false);
    });
  }

  async function reset() {
    const signal = request.current?.signal;
    if (!signal || signal.aborted) return;
    setResetting(true);
    await pending.current;
    try {
      const section = await evaluateTypicalSection(snapshot, [], signal);
      if (signal.aborted) return;
      setData(section);
      edits.current = [];
      rejectedKey.current = null;
      setEditError('');
    } catch (error) {
      if (!signal.aborted) setEditError(String(error));
    } finally {
      if (!signal.aborted) setResetting(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await pending.current;
      if (rejectedKey.current || request.current?.signal.aborted) return;
      saveTypicalSection(JSON.stringify(snapshot), edits.current);
      close(false);
    } finally {
      if (!request.current?.signal.aborted) setSaving(false);
    }
  }

  const subtab = typical?.tabs?.[active];
  const blocked = resetting || saving;
  const renderRows = (rows: TypicalRows[] = []) => rows.map((row, index) =>
    <div key={index} className="additional-row">{row.fields.map(field => {
      const key = field.id;
      const state = key && data?.states[key];
      if (!key || !state || state === 'hidden') return null;
      return <DialogField key={key} field={{ ...field, precision: data?.precision[key] }}
        value={data?.values[key]} onEdit={state === 'editable' && !blocked ? value => applyEdit(key, value) : undefined} />;
    })}</div>);

  return <DialogFrame title="Additional Inputs" onClose={() => close(false)}>
    <div className="additional-body additional-section-body">
      <AdditionalTabs tabs={groups.map(tab => ({ label: tab.label }))}
        active={activeGroup} onSelect={setActiveGroup} panelId="additional-group-panel"
        label="Additional input groups" className="additional-group-tabs" />
      {schemaError && <div role="alert" className="additional-error">Could not load inputs. {schemaError}
        <button type="button" className="additional-button" onClick={() => setSchemaAttempt(value => value + 1)}>Retry</button>
      </div>}
      {!group ? !schemaError && <p role="status">Loading inputs…</p> : !typical ?
        <ReadOnlyAdditionalPanel key={group.main_id} schema={group.schema} values={snapshot}
          label={group.label} labelledBy={`additional-group-panel-tab-${activeGroup}`} /> :
        <div id="additional-group-panel" role="tabpanel" aria-labelledby={`additional-group-panel-tab-${activeGroup}`}
          className="additional-panel" aria-busy={validating || resetting}>
          {loadError && <div role="alert" className="additional-error">{loadError}
            <button type="button" className="additional-button" onClick={() => setAttempt(value => value + 1)}>Retry</button>
          </div>}
          {editError && <div role="alert" className="additional-error">{editError}
            <button type="button" className="additional-button" onClick={() => {
              setEditError('');
              rejectedKey.current = null;
            }} disabled={validating}>Dismiss</button>
          </div>}
          {!data ? !loadError && <p role="status">Loading Typical Section defaults…</p> : <>
            <div className="additional-typical-reference"><StaticInputDiagram diagram="typical" /></div>
            <section className="additional-primary-fields" aria-labelledby="additional-primary-title">
              <h3 id="additional-primary-title">Inputs</h3>
              {renderRows(typical.primary_fields?.rows)}
            </section>
            <AdditionalTabs tabs={typical.tabs?.map(tab => ({
              label: tab.label ?? '',
              disabled: tab.disable || (tab.id === constants?.KEY_MD_TAB && snapshot[String(constants?.KEY_INCLUDE_MEDIAN)] !== 'Yes')
                || (tab.id === constants?.KEY_RL_TAB && !['Single Side', 'Both Sides'].includes(String(snapshot[String(constants?.KEY_FOOTPATH)]))),
            })) ?? []} active={active} onSelect={setActive} panelId="additional-subtab" label="Typical Section subtabs" />
            <div id="additional-subtab" role="tabpanel" aria-labelledby={`additional-subtab-tab-${active}`} className="additional-subtab"
              style={{ '--dialog-label-width': `${subtab?.label_width ?? 200}px` } as React.CSSProperties}>
              {renderRows(subtab?.rows)}
            </div>
          </>}
        </div>}
    </div>
    <footer className="additional-footer">
      <button type="button" className="additional-button" disabled={!typical || blocked || (!data && !loadError)} onClick={() => void reset()}>Defaults</button>
      <button type="button" className="additional-button" disabled={!typical || blocked || !data || !!loadError} onClick={() => void save()}>Save</button>
    </footer>
  </DialogFrame>;
}
