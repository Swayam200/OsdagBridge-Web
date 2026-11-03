/**
 * Shared schema-driven field for the Typical Section and Material dialogs.
 * Numeric text stays local until blur/Enter, matching Desktop editingFinished;
 * the parent receives raw text and delegates validation/corrections to Core.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { TypicalField } from '../../services/typicalSection';

export function DialogField({ field, value, disabled, error, onEdit }: {
  field: TypicalField; value: unknown; disabled: boolean; error?: string;
  onEdit: (key: string, value: string) => void;
}) {
  const places = field.precision ?? (field.id?.endsWith('no_of_girders') ? 0 : field.id?.endsWith('.area') ? 4 : 2);
  const formatted = typeof value === 'number' ? value.toFixed(places) : value == null ? '' : String(value);
  const [text, setText] = useState(formatted);
  // A response for another field must not replace text currently being edited.
  const dirty = useRef(false);
  useEffect(() => { if (!dirty.current) setText(formatted); }, [formatted, value]);
  const id = `dialog-${field.id}`;
  return <div className="additional-field">
    {/* Rich labels come exclusively from Core constants, never user-entered material names. */}
    {field.label_html ? <label htmlFor={id} dangerouslySetInnerHTML={{ __html: field.label ?? '' }} /> : <label htmlFor={id}>{field.label}</label>}
    <div>
      {field.type === 'combobox'
        ? <select id={id} className="osdag-select-field" value={String(value ?? '')} disabled={disabled}
            onChange={event => onEdit(field.id!, event.target.value)}>
            {!value && <option value="" />}
            {field.choices?.map(choice => <option key={choice}>{choice}</option>)}
          </select>
        : <input id={id} className="osdag-input-field" inputMode="decimal" value={text} disabled={disabled}
            aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
            onChange={event => {
              dirty.current = true;
              setText(event.target.value);
            }}
            onBlur={event => {
              dirty.current = false;
              if (event.currentTarget.value !== formatted) onEdit(field.id!, event.currentTarget.value);
              else setText(formatted);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }} />}
      {error && <span id={`${id}-error`} className="additional-field-error">{error}</span>}
    </div>
  </div>;
}
