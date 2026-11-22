import React, { useState } from 'react';
import type { TypicalField } from '../../services/typicalSection';

export function DialogField({ field, value, onEdit }: {
  field: TypicalField; value: unknown; onEdit?: (value: string) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const places = field.precision ?? (field.id?.endsWith('no_of_girders') ? 0 : field.id?.endsWith('.area') ? 4 : 2);
  const formatted = typeof value === 'number' ? value.toFixed(places) : String(value ?? '');
  const id = `dialog-${field.id}`;

  return <div className="additional-field">
    {field.label_html ? <label htmlFor={id} dangerouslySetInnerHTML={{ __html: field.label ?? '' }} /> : <label htmlFor={id}>{field.label}</label>}
    <div>
      {field.type === 'combobox'
        ? <select id={id} className="additional-control" value={String(value ?? '')} disabled={!onEdit}
            onChange={event => onEdit?.(event.currentTarget.value)}>
            {value == null && <option value="" />}
            {field.choices?.map(choice => <option key={choice}>{choice}</option>)}
          </select>
        : <input id={id} className="additional-control" inputMode="decimal" value={text ?? formatted}
            readOnly={!onEdit} disabled={!onEdit}
            onChange={event => setText(event.currentTarget.value)}
            onBlur={() => {
              if (text !== null && text.trim() !== formatted) onEdit?.(text.trim());
              setText(null);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }} />}
    </div>
  </div>;
}
