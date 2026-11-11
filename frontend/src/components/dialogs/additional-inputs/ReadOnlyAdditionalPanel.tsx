/**
 * Read-only views of the remaining Core schema groups. Only navigation is active.
 * Schema callbacks name Qt methods and are never invoked by this renderer.
 */
import React, { useId, useState } from 'react';
import type { AdditionalSection, InputValues, TypicalField, TypicalPanel } from '../../../services/typicalSection';
import { DialogField } from '../DialogField';
import { AdditionalTabs } from './AdditionalTabs';
import { StaticInputDiagram, staticDiagramFields } from './StaticInputDiagram';

function ReferenceTable({ label, columns }: { label: string; columns: string[] }) {
  return <div className="additional-reference-table">
    <table aria-label={label}>
      <thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody><tr><td colSpan={columns.length}>—</td></tr></tbody>
    </table>
  </div>;
}

function ReadOnlyField({ field, values, checkedDefault = false }: {
  field: TypicalField; values: InputValues; checkedDefault?: boolean;
}) {
  const mode = field.modes?.[String(values[field.controller ?? ''])] ?? field.modes?.Custom;
  const resolved = mode ? { ...field, ...mode } : field;
  const value = values[resolved.id ?? ''] ?? resolved.default;
  const id = `reference-${resolved.id}`;
  const label = resolved.label ?? '';

  switch (resolved.type) {
    case 'direct_widget_classes':
      if (resolved.id && staticDiagramFields[resolved.id]) {
        return <StaticInputDiagram diagram={staticDiagramFields[resolved.id]}
          memberLabel={resolved.id.startsWith('member_properties.end_diaphragm_details.') ? 'E1M1 / E1M2' : 'B1M1 – B1M8'} />;
      }
      if (resolved.id?.endsWith('.segment_table')) {
        return <ReferenceTable label="Girder segments" columns={['Member ID', 'Start (m)', 'End (m)', 'Length (m)', 'Action']} />;
      }
      return null;
    case 'load_combination':
      return <ReferenceTable label="Load combinations" columns={['Name', 'Limit State', 'Load Case', 'Factor']} />;
    case 'button':
    case 'bounds_dialog_btn':
      return <div className="additional-field">
        <label htmlFor={id} dangerouslySetInnerHTML={{ __html: label }} />
        <button id={id} type="button" className="osdag-btn-standard" disabled>{resolved.text}</button>
      </div>;
    case 'checkbox':
      return <label className="additional-reference-checkbox">
        <span dangerouslySetInnerHTML={{ __html: label }} />
        <input type="checkbox" disabled checked={value == null ? checkedDefault : Boolean(value)} />
      </label>;
    case 'mode_line_edit':
      return <div className="additional-field">
        <label htmlFor={id} dangerouslySetInnerHTML={{ __html: label }} />
        <div className="additional-reference-mode">
          <select className="osdag-select-field" disabled value=""
            aria-label={`${label.replace(/<[^>]*>/g, '')} mode`}>
            <option value="" />
            {resolved.mode_choices?.map(choice => <option key={choice}>{choice}</option>)}
          </select>
          <input id={id} className="osdag-input-field" disabled value={value == null ? '' : String(value)} />
        </div>
      </div>;
    case 'textbox':
    case 'combobox': {
      // Keep saved dynamic selections visible even if the schema has no choice list.
      const choices = resolved.choices ?? [];
      const displayChoices = value != null && !choices.includes(String(value)) ? [String(value), ...choices] : choices;
      return <DialogField field={{ ...resolved, choices: displayChoices, label_html: true }} value={value} />;
    }
    default:
      return null;
  }
}

function ReadOnlySection({ section, values }: { section: AdditionalSection; values: InputValues }) {
  if (section.type === 'description') {
    return <aside className="additional-reference-description" aria-label={section.title}>
      <h3>{section.title}</h3><p>{section.text}</p>
    </aside>;
  }
  const fields = section.rows?.flatMap(row => row.fields) ?? [];
  const content = fields.map((field, index) =>
    <ReadOnlyField key={field.id ?? index} field={field} values={values} />);
  return <section className="additional-reference-card">
    {section.title && <h3>{section.title}</h3>}
    {content}
    {section.checkbox_groups && <div className="additional-reference-checkbox-groups">
      {section.checkbox_groups.map(group => <fieldset key={group.title}>
        <legend>{group.title}</legend>
        {group.items.map(field => <ReadOnlyField key={field.id} field={field} values={values} checkedDefault={group.default_checked} />)}
      </fieldset>)}
    </div>}
  </section>;
}

function hasReadOnlyContent(section: AdditionalSection) {
  if (section.type === 'description' || section.checkbox_groups?.length) return true;
  return section.rows?.some(row => row.fields.some(field => field.type !== 'direct_widget_classes'
    || staticDiagramFields[field.id ?? ''] || field.id?.endsWith('.segment_table'))) ?? false;
}

export function ReadOnlyAdditionalPanel({ schema, values, label, labelledBy }: {
  schema: TypicalPanel; values: InputValues; label: string; labelledBy: string;
}) {
  const [active, setActive] = useState(0);
  const id = useId();
  const nestedTabs = schema.tabs;
  const selected = nestedTabs?.[active];
  const panel = selected?.schema ?? selected ?? schema;
  const sections = (panel.sections ?? []).filter(hasReadOnlyContent);
  // Desktop places the full-width member overview above the two form columns.
  const overview = sections[0]?.col_span === 2 ? sections[0] : undefined;
  const widths = panel.layout?.column_widths ?? [3, 2];
  const columns = widths.map((width, index) => ({
    width,
    sections: sections.filter(section => (section.column ?? 0) === index && section.col_span !== 2),
  })).filter(column => column.sections.length > 0);

  return <div id="additional-group-panel" role="tabpanel"
    aria-labelledby={labelledBy}
    className="additional-panel additional-reference-panel">
    {nestedTabs && <AdditionalTabs
      tabs={nestedTabs.map(tab => ({ label: tab.title ?? tab.label ?? '', disabled: tab.disable }))}
      active={active} onSelect={setActive} panelId={id} label={`${label} subtabs`} />}
    <div id={id} role={nestedTabs ? 'tabpanel' : undefined}
      aria-labelledby={nestedTabs ? `${id}-tab-${active}` : undefined} className="additional-reference-content">
      <div className="additional-reference-grid"
        style={{ '--reference-columns': columns.map(column => `${column.width}fr`).join(' ') } as React.CSSProperties}>
        {overview && <div className="additional-reference-wide"><ReadOnlySection section={overview} values={values} /></div>}
        {columns.map((column, columnIndex) => <div key={columnIndex} className="additional-reference-column">
          {column.sections.map((section, index) => <ReadOnlySection key={section.id ?? index} section={section} values={values} />)}
        </div>)}
        {sections.filter(section => section.col_span === 2 && section !== overview).map((section, index) =>
          <div className="additional-reference-wide" key={section.id ?? index}>
            <ReadOnlySection section={section} values={values} />
          </div>)}
      </div>
    </div>
  </div>;
}
