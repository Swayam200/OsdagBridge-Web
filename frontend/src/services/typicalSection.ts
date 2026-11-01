/**
 * Typical Section schema/evaluation contracts and the existing Axios connection.
 * Requests carry a full input snapshot; responses contain only group-owned keys
 * plus validation issues, control states and layout notices.
 */
import { apiClient } from './api';

export type InputValues = Record<string, unknown>;
export interface TypicalField {
  id?: string;
  label?: string;
  type?: string;
  choices?: string[];
  read_only?: boolean;
  precision?: number;
  label_html?: boolean;
}
export interface TypicalPanel {
  id: string;
  label?: string;
  disable?: boolean;
  rows?: { fields: TypicalField[] }[];
  primary_fields?: { rows: { fields: TypicalField[] }[] };
  tabs?: TypicalPanel[];
}
export interface AdditionalTab { label: string; schema: TypicalPanel; main_id: string }
export interface TypicalIssue { key: string; message: string; corrected_value: unknown; restoreLayout?: boolean }
export interface TypicalEvaluation {
  values: InputValues;
  issues: TypicalIssue[];
  disabled: string[];
  hidden: string[];
  notices: string[];
}
export type EvaluateTypical = (inputs: InputValues, changedKey?: string, validateAll?: boolean) => Promise<TypicalEvaluation>;

export function typicalEvaluator(signal?: AbortSignal): EvaluateTypical {
  // One signal belongs to one dialog opening and cancels its requests on close.
  return async (inputs, changed_key, validate_all = false) => {
    const res = await apiClient.post<TypicalEvaluation>('/additional-inputs/evaluate', { inputs, changed_key, validate_all }, { signal });
    return res.data;
  };
}
