/** Standard material information from the existing catalogue and Core constants. */
import { apiClient } from './api';
import type { BridgeConstants } from '../types/schema';
export interface MaterialField {
  id: string;
  column: string;
  label?: string;
  type?: string;
  precision?: number;
  label_html?: boolean;
  choices?: string[];
}

export interface MaterialProperties {
  material: string;
  fields: MaterialField[];
  values: Record<string, unknown>;
}
export interface MaterialDialogSelection { member: string; grade: string }

export type MaterialCatalogue = Record<'steel' | 'concrete', Record<string, Record<string, number>>> & {
  fields: Record<'steel' | 'concrete', MaterialField[]>;
};

export async function fetchMaterialCatalogue(): Promise<MaterialCatalogue> {
  const { data } = await apiClient.get<MaterialCatalogue>('/materials/base-values');
  return data;
}

export function materialPropertiesFor(
  catalogue: MaterialCatalogue, member: string, grade: string, constants: BridgeConstants,
): MaterialProperties {
  const concrete = member === constants.KEY_DECK_CONCRETE_GRADE_BASIC;
  const kind = concrete ? 'concrete' : 'steel';
  const normalize = (name: string) => name.replace(/\s/g, '').toUpperCase();
  const values = Object.entries(catalogue[kind]).find(([name]) => normalize(name) === normalize(grade))?.[1];
  if (!values) throw new Error('Material grade was not found in Core.');

  const fields = catalogue.fields[kind].map(field => {
    if (!Number.isFinite(values[field.column])) {
      throw new Error('Core material information is incomplete.');
    }
    // Steel information uses the selected member's canonical prefix without changing its values.
    return { ...field, id: concrete ? field.id : field.id.replace(String(constants.KEY_GIRDER), member) };
  });
  return { material: grade, fields, values: Object.fromEntries(fields.map(field => [field.id, values[field.column]])) };
}
