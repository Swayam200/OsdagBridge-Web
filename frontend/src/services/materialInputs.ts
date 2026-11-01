/**
 * Material dialog API contracts using the existing Axios connection.
 * API values use member-prefixed keys; the browser-session custom registry stores
 * suffixes so one steel definition can be selected by all three steel members.
 */
import { apiClient } from './api';
import type { InputValues, TypicalField, TypicalIssue } from './typicalSection';

export interface MaterialProperties {
  member: string;
  material: string;
  fields: TypicalField[];
  values: InputValues;
}
export interface MaterialEvaluation { material: string; values: InputValues; issues: TypicalIssue[] }
export interface CustomMaterial { kind: 'steel' | 'concrete'; values: InputValues }
export interface MaterialDialogSelection { member: string; grade: string; custom: boolean }

export async function fetchMaterialProperties(member: string, grade: string, signal?: AbortSignal): Promise<MaterialProperties> {
  const result = await apiClient.get('/materials/properties', { params: { member, grade }, signal });
  return result.data;
}
export function materialEvaluator(member: string, signal?: AbortSignal) {
  return async (values: InputValues, changed_key?: string, validate_all = false): Promise<MaterialEvaluation> => {
    const result = await apiClient.post('/materials/evaluate', { member, values, changed_key, validate_all }, { signal });
    return result.data;
  };
}
export function memberValues(member: string, definition: CustomMaterial): InputValues {
  // For example, shared `fy` becomes `material.cross_bracing.fy` on selection.
  return Object.fromEntries(Object.entries(definition.values).map(([suffix, value]) => [`${member}.${suffix}`, value]));
}
