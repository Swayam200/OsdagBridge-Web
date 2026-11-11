/**
 * Read-only material information using the existing Axios connection.
 * Values are stored Core catalogue properties; no custom evaluation is exposed.
 */
import { apiClient } from './api';
import type { InputValues, TypicalField } from './typicalSection';

export interface MaterialProperties {
  member: string;
  material: string;
  fields: TypicalField[];
  values: InputValues;
}
export interface MaterialDialogSelection { member: string; grade: string }

export async function fetchMaterialProperties(member: string, grade: string, signal?: AbortSignal): Promise<MaterialProperties> {
  const result = await apiClient.get('/materials/properties', { params: { member, grade }, signal });
  return result.data;
}
