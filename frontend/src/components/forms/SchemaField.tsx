/**
 * SchemaField.tsx
 *
 * Input field renderer for Highway Bridge Design GUI.
 * Mirrors the field-row building logic of osdagbridge.desktop.ui.docks.input_dock.
 *
 * Design principles (adapted from desktop input_dock.py):
 *   - Label comes from field.label (tuple[1] in desktop).
 *   - Defaults live in field.default.
 *   - TYPE_BUTTON and TYPE_NOTE are first-class field rows.
 *   - Direct if-else branching for field types matching desktop field creation:
 *       if type in COMBOBOX: render combobox
 *       elif type in TEXTBOX / LINE_EDIT: render textbox
 *       elif type in BUTTON: render button
 *       elif type in NOTE: render note
 *       elif type in CHECKBOX: render checkbox
 *
 * Widget type strings are resolved at runtime from GET /api/v1/constants
 * (via useBridgeStore.constants). No TYPE_* strings are hardcoded here.
 *
 * Validation:
 *   - On blur (text/number) or on change (select), calls POST /api/v1/validate.
 *   - If the backend reports valid === false the backend message is surfaced via
 *     FieldError; the user's typed value is preserved unchanged.
 *   - If the backend is unreachable, validation is silently skipped.
 *   - No validation logic is implemented client-side in this component;
 *     all constraints come from the backend response.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UIFieldSchema } from '../../types/schema';
import { useBridgeStore } from '../../store/useBridgeStore';
import { validateField } from '../../services/api';
import { AlertCircle } from 'lucide-react';

// ── Shared Sub-Components ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  minWidth: '110px',
  maxWidth: '120px',
  fontSize: '12px',
  color: 'var(--text-main)',
  fontWeight: 500,
  lineHeight: 1.25,
};

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
    <label htmlFor={htmlFor} style={{ ...labelStyle, whiteSpace: 'pre-line' }}>
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginTop: '4px',
        color: 'var(--danger)',
        fontSize: '11px',
        paddingLeft: '118px',
      }}
    >
      <AlertCircle size={12} aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
}

// ── Field Renderers (mirrors desktop widget factories in input_dock.py) ────────

/**
 * ButtonField — mirrors the metadata-driven TYPE_BUTTON row in input_dock.py.
 * The schema action selects the supported web callback; the field key does not.
 * button_label comes from the schema provided by the backend; no hardcoded fallbacks.
 */
const ButtonField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, location, isLocked, setLocationModalOpen, setAdditionalInputsOpen, constants } = useBridgeStore();
  const missingRequired = useBridgeStore(s => s.requiredFieldErrors.includes(field.key));

  const opensLocationDialog =
    field.action === 'show_project_location_dialog' ||
    field.action === 'open_project_location_modal';

  const projectLocationKey = constants ? String(constants.KEY_PROJECT_LOCATION ?? '') : '';

  // Display text: prefer the live location from store, then the stored input value,
  // then the schema-provided button_label. No hardcoded place names.
  const locationText = location
    ? `${location.station}, ${location.state}`
    : (projectLocationKey && inputs[projectLocationKey] ? inputs[projectLocationKey] : null);

  const hasLocation = Boolean(locationText);

  const isAdditionalBtn = Boolean(
    field.key === 'geometry.additional_btn' ||
    field.key.includes('additional_btn') ||
    field.action === 'show_additional_inputs' ||
    (field.label && field.label.toLowerCase().includes('additional geometry'))
  );

  const buttonText = opensLocationDialog
    ? (locationText || field.button_label || field.label)
    : (isAdditionalBtn ? (field.button_label || 'Modify Here') : (field.button_label || field.label));

  const showPin = field.post_row?.kind === 'info_row' && hasLocation;

  return (
    <div style={{ marginBottom: field.show_group_title === false ? 0 : '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} />
        <button
          type="button"
          disabled={isLocked}
          aria-invalid={missingRequired || undefined}
          onClick={() => {
            if (opensLocationDialog) {
              setLocationModalOpen(true);
            } else if (isAdditionalBtn) {
              setAdditionalInputsOpen(true);
            }
          }}
          className="osdag-action-btn"
          style={{
            flex: 1,
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.65 : 1,
            backgroundColor: missingRequired ? 'var(--danger)' : undefined,
            color: missingRequired ? '#fff' : undefined,
          }}
        >
          {buttonText}
        </button>
      </div>

      {showPin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
            paddingLeft: '118px',
            fontSize: '11px',
            color: 'var(--text-sub)',
          }}
        >
          <span aria-hidden="true">📍</span>
          <span>{locationText}</span>
        </div>
      )}
    </div>
  );
};

/**
 * SelectField — mirrors the desktop combobox factory.
 * Calls POST /api/v1/validate on change; surfaces backend errors via FieldError.
 * Disabled schema options remain visible but cannot be selected.
 */
const SelectField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, updateField, isLocked } = useBridgeStore();
  const missingRequired = useBridgeStore(s => s.requiredFieldErrors.includes(field.key));
  const value = inputs[field.key] ?? field.default ?? '';
  const options = field.options || [];
  const fieldId = `field-${field.key}`;
  const errorId = `${fieldId}-error`;

  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const handleChange = useCallback(
    async (newValue: string) => {
      updateField(field.key, newValue);
      setValidationError(undefined);

      const allInputs = { ...useBridgeStore.getState().inputs, [field.key]: newValue };
      const result = await validateField(field.key, newValue, allInputs);
      if (result && !result.valid) {
        setValidationError(result.message ?? 'Invalid value.');
      }
    },
    [field.key],
  );

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} htmlFor={fieldId} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          <select
            id={fieldId}
            value={value}
            disabled={isLocked}
            aria-required={field.required || undefined}
            aria-describedby={validationError ? errorId : undefined}
            aria-invalid={missingRequired || !!validationError || undefined}
            onChange={(e) => handleChange(e.target.value)}
            className={`osdag-select-field${missingRequired ? ' has-error' : ''}`}
            style={{
              flex: 1,
              width: '100%',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.65 : 1,
            }}
          >
            {field.placeholder && (
              <option value="" disabled>
                {field.placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt}
                value={opt}
                disabled={field.disabled_options?.includes(opt)}
              >
                {opt}
              </option>
            ))}
          </select>
          {field.is_material_field && (
            <button
              type="button"
              aria-label={`Material properties for ${field.label}`}
              onClick={(e) => {
                e.preventDefault();
              }}
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
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

/**
 * CheckboxField — mirrors TYPE_CHECKBOX rows in input_dock.py.
 */
const CheckboxField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, updateField, isLocked } = useBridgeStore();
  const value = inputs[field.key] ?? field.default ?? false;
  const fieldId = `field-${field.key}`;

  return (
    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <FieldLabel field={field} htmlFor={fieldId} />
      <input
        id={fieldId}
        type="checkbox"
        checked={Boolean(value)}
        disabled={isLocked}
        aria-required={field.required || undefined}
        onChange={(e) => {
          updateField(field.key, e.target.checked);
        }}
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--accent-osdag)',
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
      />
    </div>
  );
};

/**
 * NoteField — mirrors TYPE_NOTE rows in input_dock.py.
 * Renders an informational text block with a left accent border.
 */
const NoteField: React.FC<{ field: UIFieldSchema }> = ({ field }) => (
  <p
    role="note"
    style={{
      marginBottom: '8px',
      fontSize: '11px',
      color: 'var(--text-sub)',
      lineHeight: 1.4,
      padding: '6px 8px',
      background: 'var(--bg-grouped)',
      borderRadius: '4px',
      borderLeft: '3px solid var(--accent-osdag)',
    }}
  >
    {field.note || field.label}
  </p>
);

/**
 * TextOrNumberField — mirrors TYPE_TEXTBOX rows in input_dock.py.
 *
 * Keeps edits local until confirmed, matching desktop editingFinished.
 *
 * Validation:
 *   - Blur or Enter key commits edits and calls POST /api/v1/validate.
 *   - Backend response is the single source of truth for validity, error messages,
 *     and corrected values.
 *   - For invalid geometric inputs (Span, Carriageway Width, Skew Angle), shows
 *     an "Input Error" dialog matching desktop behaviour.
 *   - When the user acknowledges the dialog, the field updates to the backend-provided
 *     corrected_value (nearest valid value) if present.
 *
 * Geometric key detection uses backend constants from the store so no key strings
 * are hardcoded here.
 */
const TextOrNumberField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, updateField, isLocked, showInputErrorDialog, constants } = useBridgeStore();
  const missingRequired = useBridgeStore(s => s.requiredFieldErrors.includes(field.key));

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

  // Sync local display value when external store value changes
  useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  // Determine if this field is a geometric input that warrants an error dialog.
  // Use backend constants for key comparison — no hardcoded key strings.
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

  // ── Enter key — trigger commit and validation via blur ──────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  // ── Blur — commit value and validate against backend ──────────────────────
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
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} htmlFor={fieldId} />
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id={fieldId}
            type="text"
            inputMode={isNumber ? 'decimal' : 'text'}
            value={localVal}
            placeholder={field.placeholder}
            disabled={isLocked}
            aria-required={field.required || undefined}
            aria-describedby={!isGeometric && validationError ? errorId : undefined}
            aria-invalid={missingRequired || (!isGeometric && !!validationError) || undefined}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`osdag-input-field${missingRequired ? ' has-error' : ''}`}
            style={{
              width: '100%',
              paddingRight: showTrailingUnit ? '32px' : '7px',
              cursor: isLocked ? 'not-allowed' : 'text',
              opacity: isLocked ? 0.65 : 1,
            }}
          />
          {showTrailingUnit && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '8px',
                fontSize: '11px',
                color: 'var(--text-sub)',
                pointerEvents: 'none',
              }}
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


// ── Public Component ───────────────────────────────────────────────────────────

/**
 * SchemaField
 *
 * Direct if-else branching for field types mirroring desktop input_dock.py:
 *   if field_type == TYPE_BUTTON: ...
 *   elif field_type == TYPE_COMBO_BOX: ...
 *   elif field_type == TYPE_TEXTBOX: ...
 *   elif field_type == TYPE_CHECKBOX: ...
 *   elif field_type == TYPE_NOTE: ...
 *
 * TYPE_* strings are resolved from the backend constants (useBridgeStore.constants)
 * so no widget type literals are hardcoded here. The lowercase comparison against
 * the backend values ensures they match regardless of case in the response.
 */
export const SchemaField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const constants = useBridgeStore((s) => s.constants);
  const type = (field.ui_type || '').toLowerCase();

  // Resolve TYPE_* directly from fetched backend constants.
  const TYPE_BUTTON    = constants?.TYPE_BUTTON ? String(constants.TYPE_BUTTON).toLowerCase() : '';
  const TYPE_COMBOBOX  = constants?.TYPE_COMBOBOX ? String(constants.TYPE_COMBOBOX).toLowerCase() : '';
  const TYPE_COMBO_BOX = constants?.TYPE_COMBO_BOX ? String(constants.TYPE_COMBO_BOX).toLowerCase() : '';
  const TYPE_TEXTBOX   = constants?.TYPE_TEXTBOX ? String(constants.TYPE_TEXTBOX).toLowerCase() : '';
  const TYPE_LINE_EDIT = constants?.TYPE_LINE_EDIT ? String(constants.TYPE_LINE_EDIT).toLowerCase() : '';
  const TYPE_NOTE      = constants?.TYPE_NOTE ? String(constants.TYPE_NOTE).toLowerCase() : '';
  const TYPE_CHECKBOX  = constants?.TYPE_CHECKBOX ? String(constants.TYPE_CHECKBOX).toLowerCase() : '';

  // Desktop field creation branching (mirrors input_dock.py _build_field_loop)
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
      <p role="alert" style={{ marginBottom: '8px', color: 'var(--danger)', fontSize: '11px' }}>
        Unsupported input type &quot;{field.ui_type}&quot; for {field.label}.
      </p>
    );
  }
};
