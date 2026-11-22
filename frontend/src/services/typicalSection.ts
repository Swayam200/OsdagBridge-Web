import { apiClient } from './api';

export type InputValues = Record<string, unknown>;
export interface TypicalEdit { key: string; value: string }
export interface TypicalSectionValues {
  values: InputValues;
  precision: Record<string, number>;
  states: Record<string, 'editable' | 'readonly' | 'hidden'>;
}

export async function evaluateTypicalSection(inputs: InputValues, edits: TypicalEdit[], signal: AbortSignal) {
  try {
    const { data } = await apiClient.post<TypicalSectionValues>('/additional-inputs/typical-section', { inputs, edits }, { signal });
    return data;
  } catch (error) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === 'string') throw new Error(detail);
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      throw new Error(Object.values(detail).join(' '));
    }
    throw error;
  }
}

export interface TypicalField {
  id?: string;
  label?: string;
  type?: string;
  choices?: string[];
  precision?: number;
  label_html?: boolean;
  text?: string;
  default?: unknown;
  controller?: string;
  modes?: Record<string, TypicalField>;
  mode_choices?: string[];
}

export interface TypicalRows { fields: TypicalField[] }
export interface AdditionalSection {
  id?: string;
  title?: string;
  type?: string;
  text?: string;
  column?: number;
  col_span?: number;
  rows?: TypicalRows[];
  checkbox_groups?: { title: string; default_checked?: boolean; items: TypicalField[] }[];
}
export interface TypicalPanel {
  id: string;
  label?: string;
  title?: string;
  schema?: TypicalPanel;
  disable?: boolean;
  label_width?: number;
  rows?: TypicalRows[];
  primary_fields?: { rows: TypicalRows[]; label_width?: number };
  tabs?: TypicalPanel[];
  layout?: { column_widths?: number[] };
  sections?: AdditionalSection[];
}
export interface AdditionalTab { label: string; schema: TypicalPanel; main_id: string }
