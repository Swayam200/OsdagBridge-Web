/**
 * SchemaField.tsx
 * Input field renderer styled with Tailwind CSS utility classes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UIFieldSchema } from '../../types/schema';
import { ProjectLocation } from '../../types/location';
import { useBridgeStore } from '../../store/useBridgeStore';
import { validateField } from '../../services/api';
import { AlertCircle } from 'lucide-react';

// ── Shared Sub-Components ──────────────────────────────────────────────────────

function FieldLabel({ field, htmlFor }: { field: UIFieldSchema; htmlFor?: string }) {
  let displayLabel = field.label;
  if (field.required) {
    if (displayLabel.includes('\n')) {
      const idx = displayLabel.indexOf('\n');
      displayLabel = displayLabel.slice(0, idx) + '*' + displayLabel.slice(idx);
    } else {
      displayLabel = displayLabel + '*';
    }
  }

  return (
    <label
      htmlFor={htmlFor}
      className="w-[110px] min-w-[110px] max-w-[110px] shrink-0 text-xs text-main font-semibold leading-tight whitespace-pre-line text-left select-none"
    >
      {displayLabel}
    </label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <div
      id={id}
      role="alert"
      className="flex items-center gap-1 mt-1 text-danger text-[11px] pl-[122px]"
    >
      <AlertCircle size={12} aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
}

// ── Field Renderers ────────────────────────────────────────────────────────────

const ButtonField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, isLocked, setLocationModalOpen, constants, darkMode } = useBridgeStore();

  const opensLocationDialog =
    field.action === 'show_project_location_dialog' ||
    field.action === 'open_project_location_modal';

  const projectLocationKey = constants ? String(constants.KEY_PROJECT_LOCATION ?? '') : '';

  // Saved dialog result (desktop get_selected_location dict) drives the info row,
  // as in input_dock._update_project_location_display.
  const savedLocation: ProjectLocation | undefined =
    opensLocationDialog && projectLocationKey ? inputs[projectLocationKey] : undefined;

  const isAdditionalBtn = Boolean(
    field.key === 'geometry.additional_btn' ||
    field.key.includes('additional_btn') ||
    field.action === 'show_additional_inputs' ||
    (field.label && field.label.toLowerCase().includes('additional geometry'))
  );

  const buttonText = isAdditionalBtn ? (field.button_label || 'Modify Here') : (field.button_label || field.label);

  const showInfoRow = field.post_row?.kind === 'info_row' && Boolean(savedLocation?.show_display);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 w-full min-h-[28px]">
        <FieldLabel field={field} />
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            if (opensLocationDialog) {
              setLocationModalOpen(true);
            }
          }}
          className="w-[155px] min-w-[155px] max-w-[155px] shrink-0 h-7 min-h-[28px] px-3 text-[11px] font-bold rounded text-center select-none flex items-center justify-center transition-colors border cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed bg-accent hover:bg-accent-hover text-white border-accent-border"
        >
          <span className="truncate">{buttonText}</span>
        </button>
      </div>

      {/* Info row centred under the button (same fixed 155px column) */}
      {showInfoRow && (
        <div className="flex justify-end mt-2">
          <div className="w-[155px] min-w-0 flex items-center justify-center gap-1.5 text-xs text-main">
            <img
              src={darkMode ? '/vectors/location_pin_dark.svg' : '/vectors/location_pin.svg'}
              alt=""
              width={20}
              height={20}
              aria-hidden="true"
              className="shrink-0"
            />
            <span className="truncate" title={savedLocation?.display_text}>
              {savedLocation?.display_text || 'Location not selected'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const SelectField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, updateField, isLocked, setMaterialDialog } = useBridgeStore();
  const value = inputs[field.key] ?? field.default ?? '';
  // Standard grades are available for inspection. Custom entry is deferred.
  const options = field.is_material_field
    ? [...new Set([...(field.options || []), 'Custom'])]
    : field.options || [];
  const fieldId = `field-${field.key}`;
  const errorId = `${fieldId}-error`;

  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const handleChange = useCallback(
    async (newValue: string) => {
      if (field.is_material_field && newValue === 'Custom') return;
      updateField(field.key, newValue);
      setValidationError(undefined);

      const allInputs = { ...useBridgeStore.getState().inputs, [field.key]: newValue };
      const result = await validateField(field.key, newValue, allInputs);
      if (result && !result.valid) {
        setValidationError(result.message ?? 'Invalid value.');
      }
    },
    [field.key, field.is_material_field, updateField],
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 w-full min-h-[28px]">
        <FieldLabel field={field} htmlFor={fieldId} />
        <div className="flex items-center gap-1.5 w-[155px] min-w-[155px] max-w-[155px] shrink-0">
          <select
            id={fieldId}
            value={value}
            disabled={isLocked}
            aria-required={field.required || undefined}
            aria-describedby={validationError ? errorId : undefined}
            aria-invalid={validationError ? true : undefined}
            onChange={(e) => handleChange(e.target.value)}
            className={`${
              field.is_material_field ? 'w-[128px] min-w-[128px]' : 'w-full'
            } h-7 min-h-[28px] py-0.5 pl-2 pr-7 text-xs border border-input-border rounded-[5px] bg-input text-main outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus cursor-pointer appearance-none bg-[image:var(--select-arrow)] bg-no-repeat bg-[right_6px_center] bg-[length:16px_16px] disabled:bg-input-disabled disabled:text-input-disabled-text disabled:cursor-not-allowed`}
          >
            {field.placeholder && (
              <option value="" disabled className="bg-input text-muted">
                {field.placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt}
                value={opt}
                disabled={field.disabled_options?.includes(opt) || (field.is_material_field && opt === 'Custom')}
                title={field.is_material_field && opt === 'Custom' ? 'Custom material entry is not available yet.' : undefined}
                className="bg-input text-main"
              >
                {opt}
              </option>
            ))}
          </select>
          {field.is_material_field && (
            <button
              type="button"
              aria-label={`Material properties for ${field.label}`}
              onClick={() => setMaterialDialog({ member: field.key, grade: String(value) })}
              className="w-5 h-5 min-w-[20px] shrink-0 p-0 border-0 bg-transparent cursor-pointer flex items-center justify-center"
            >
              <img src="/vectors/msg_about.svg" alt="" width={18} height={18} />
            </button>
          )}
        </div>
      </div>
      <FieldError id={errorId} error={validationError} />
    </div>
  );
};

const CheckboxField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, updateField, isLocked } = useBridgeStore();
  const value = inputs[field.key] ?? field.default ?? false;
  const fieldId = `field-${field.key}`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 w-full min-h-[28px]">
        <FieldLabel field={field} htmlFor={fieldId} />
        <div className="w-[155px] min-w-[155px] max-w-[155px] shrink-0 flex items-center">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(value)}
            disabled={isLocked}
            aria-required={field.required || undefined}
            onChange={(e) => updateField(field.key, e.target.checked)}
            className="w-4 h-4 accent-accent cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

const NoteField: React.FC<{ field: UIFieldSchema }> = ({ field }) => (
  <p
    role="note"
    className="mb-2 text-[11px] text-sub leading-snug p-2 bg-grouped rounded border-l-4 border-accent"
  >
    {field.note || field.label}
  </p>
);

const TextOrNumberField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, updateField, isLocked, showInputErrorDialog, constants } = useBridgeStore();

  const value = inputs[field.key] ?? field.default ?? '';
  const [localVal, setLocalVal] = useState<string>(
    value !== null && value !== undefined ? String(value) : '',
  );
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const fieldId = `field-${field.key}`;
  const errorId = `${fieldId}-error`;

  const isNumber =
    field.ui_type === 'number' ||
    (field.ui_type === 'textbox' &&
      (field.min != null ||
        field.max != null ||
        field.step != null ||
        typeof field.default === 'number' ||
        Boolean(field.unit)));

  useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  const isGeometric = Boolean(
    constants && (
      field.key === String(constants.KEY_SPAN ?? '') ||
      field.key === String(constants.KEY_CARRIAGEWAY_WIDTH ?? '') ||
      field.key === String(constants.KEY_SKEW_ANGLE ?? '')
    )
  );

  const handleTyping = (raw: string) => {
    setLocalVal(raw);
    if (validationError) setValidationError(undefined);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const handleBlur = useCallback(async () => {
    const trimmed = localVal.trim();

    let committed: string | number | null;

    if (!isNumber) {
      committed = trimmed;
      updateField(field.key, trimmed);
    } else if (trimmed === '') {
      committed = null;
      updateField(field.key, null);
    } else {
      const n = Number(trimmed);
      if (Number.isNaN(n)) {
        committed = trimmed;
        updateField(field.key, trimmed);
      } else {
        committed = n;
        updateField(field.key, n);
      }
    }

    const allInputs = { ...useBridgeStore.getState().inputs, [field.key]: committed };
    const result = await validateField(field.key, committed, allInputs);

    if (result && !result.valid) {
      const message = result.message ?? 'Invalid value.';

      if (isGeometric) {
        showInputErrorDialog(message, () => {
          if (result.corrected_value !== null && result.corrected_value !== undefined) {
            updateField(field.key, result.corrected_value);
            setLocalVal(String(result.corrected_value));
          }
        });
      } else {
        setValidationError(message);
      }
    } else {
      setValidationError(undefined);
    }
  }, [field.key, isGeometric, isNumber, localVal, showInputErrorDialog, updateField]);

  const showTrailingUnit = Boolean(field.unit && !field.placeholder && !isGeometric);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 w-full min-h-[28px]">
        <FieldLabel field={field} htmlFor={fieldId} />
        <div className="relative flex items-center w-[155px] min-w-[155px] max-w-[155px] shrink-0">
          <input
            id={fieldId}
            type="text"
            inputMode={isNumber ? 'decimal' : 'text'}
            value={localVal}
            placeholder={field.placeholder}
            disabled={isLocked}
            aria-required={field.required || undefined}
            aria-describedby={!isGeometric && validationError ? errorId : undefined}
            aria-invalid={!isGeometric && validationError ? true : undefined}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`w-full h-7 min-h-[28px] py-0.5 px-2 text-xs border rounded-[5px] bg-input text-main outline-none transition-colors disabled:bg-input-disabled disabled:text-input-disabled-text disabled:cursor-not-allowed ${
              showTrailingUnit ? 'pr-8' : ''
            } ${
              !isGeometric && validationError
                ? 'border-[#d32f2f] focus:border-[#d32f2f] focus:ring-1 focus:ring-[#d32f2f]'
                : 'border-input-border focus:border-border-focus focus:ring-1 focus:ring-border-focus'
            }`}
          />
          {showTrailingUnit && (
            <span
              aria-hidden="true"
              className="absolute right-2 text-[11px] text-sub pointer-events-none select-none"
            >
              {field.unit}
            </span>
          )}
        </div>
      </div>
      {!isGeometric && <FieldError id={errorId} error={validationError} />}
    </div>
  );
};

export const SchemaField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const constants = useBridgeStore((s) => s.constants);
  const type = (field.ui_type || '').toLowerCase();

  const TYPE_BUTTON    = constants?.TYPE_BUTTON ? String(constants.TYPE_BUTTON).toLowerCase() : '';
  const TYPE_COMBOBOX  = constants?.TYPE_COMBOBOX ? String(constants.TYPE_COMBOBOX).toLowerCase() : '';
  const TYPE_COMBO_BOX = constants?.TYPE_COMBO_BOX ? String(constants.TYPE_COMBO_BOX).toLowerCase() : '';
  const TYPE_TEXTBOX   = constants?.TYPE_TEXTBOX ? String(constants.TYPE_TEXTBOX).toLowerCase() : '';
  const TYPE_LINE_EDIT = constants?.TYPE_LINE_EDIT ? String(constants.TYPE_LINE_EDIT).toLowerCase() : '';
  const TYPE_NOTE      = constants?.TYPE_NOTE ? String(constants.TYPE_NOTE).toLowerCase() : '';
  const TYPE_CHECKBOX  = constants?.TYPE_CHECKBOX ? String(constants.TYPE_CHECKBOX).toLowerCase() : '';

  if (TYPE_BUTTON && type === TYPE_BUTTON) {
    return <ButtonField field={field} />;
  } else if (
    (TYPE_COMBOBOX && type === TYPE_COMBOBOX) ||
    (TYPE_COMBO_BOX && type === TYPE_COMBO_BOX) ||
    type === 'select' ||
    type === 'dropdown'
  ) {
    return <SelectField field={field} />;
  } else if (
    (TYPE_TEXTBOX && type === TYPE_TEXTBOX) ||
    (TYPE_LINE_EDIT && type === TYPE_LINE_EDIT) ||
    type === 'text' ||
    type === 'number' ||
    type === 'spin_box' ||
    type === 'file_browser'
  ) {
    return <TextOrNumberField field={field} />;
  } else if (TYPE_CHECKBOX && type === TYPE_CHECKBOX) {
    return <CheckboxField field={field} />;
  } else if (TYPE_NOTE && type === TYPE_NOTE) {
    return <NoteField field={field} />;
  } else {
    return (
      <p role="alert" className="mb-2 text-[#ff0000] text-[11px]">
        Unsupported input type &quot;{field.ui_type}&quot; for {field.label}.
      </p>
    );
  }
};
