/** Read-only fields using backend material definitions. */
import React from 'react';
import type { MaterialField } from '../../services/materialInputs';

export function DialogField({ field, value }: {
  field: MaterialField; value: unknown;
}) {
  const places = field.precision ?? (field.id?.endsWith('no_of_girders') ? 0 : field.id?.endsWith('.area') ? 4 : 2);
  const formatted = typeof value === 'number' ? value.toFixed(places) : value == null ? '' : String(value);
  const id = `dialog-${field.id}`;
  return <div className="additional-field">
    {/* Rich labels come exclusively from Core constants, never user-entered material names. */}
    {field.label_html ? <label htmlFor={id} dangerouslySetInnerHTML={{ __html: field.label ?? '' }} /> : <label htmlFor={id}>{field.label}</label>}
    <div>
      {field.type === 'combobox'
        ? <select id={id} className="h-7 min-h-7 appearance-none rounded-[5px] border border-input-border bg-input-disabled bg-[image:var(--select-arrow)] bg-no-repeat text-xs text-sub" value={String(value ?? '')} disabled>
            {!value && <option value="" />}
            {field.choices?.map(choice => <option key={choice}>{choice}</option>)}
          </select>
        : <input id={id} className="h-7 min-h-7 rounded-md border border-input-border text-xs" inputMode="decimal" value={formatted} disabled
            aria-invalid={false} />}
    </div>
  </div>;
}
