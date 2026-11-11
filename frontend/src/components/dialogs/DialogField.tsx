/** Read-only schema fields shared by Additional Inputs and Material Information. */
import React from 'react';
import type { TypicalField } from '../../services/typicalSection';

export function DialogField({ field, value }: {
  field: TypicalField; value: unknown;
}) {
  const places = field.precision ?? (field.id?.endsWith('no_of_girders') ? 0 : field.id?.endsWith('.area') ? 4 : 2);
  const formatted = typeof value === 'number' ? value.toFixed(places) : value == null ? '' : String(value);
  const id = `dialog-${field.id}`;
  return <div className="additional-field">
    {/* Rich labels come exclusively from Core constants, never user-entered material names. */}
    {field.label_html ? <label htmlFor={id} dangerouslySetInnerHTML={{ __html: field.label ?? '' }} /> : <label htmlFor={id}>{field.label}</label>}
    <div>
      {field.type === 'combobox'
        ? <select id={id} className="osdag-select-field" value={String(value ?? '')} disabled>
            {!value && <option value="" />}
            {field.choices?.map(choice => <option key={choice}>{choice}</option>)}
          </select>
        : <input id={id} className="osdag-input-field" inputMode="decimal" value={formatted} disabled
            aria-invalid={false} />}
    </div>
  </div>;
}
