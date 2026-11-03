/** Read-only Core schema field; evaluation and editing are deferred. */
import React from 'react';
import type { TypicalField } from '../../types/additionalInputs';

export function DialogField({ field, value }: { field: TypicalField; value: unknown }) {
  const id = `dialog-${field.id}`;
  const text = value == null ? '' : String(value);
  return <div className="additional-field">
    {field.label_html
      ? <label htmlFor={id} dangerouslySetInnerHTML={{ __html: field.label ?? '' }} />
      : <label htmlFor={id}>{field.label}</label>}
    {field.type === 'combobox'
      ? <select id={id} className="osdag-select-field" value={text} disabled>
          <option value="" />
          {field.choices?.map(choice => <option key={choice}>{choice}</option>)}
        </select>
      : <input id={id} className="osdag-input-field" value={text} disabled />}
  </div>;
}
