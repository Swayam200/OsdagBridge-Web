/** Standard material information from the existing catalogue and Core constants. */
import { apiClient } from './api';
import type { BridgeConstants } from '../types/schema';
import type { InputValues, TypicalField } from './typicalSection';

export interface MaterialProperties {
  material: string;
  fields: TypicalField[];
  values: InputValues;
}
export interface MaterialDialogSelection { member: string; grade: string }

type Catalogue = Record<'steel' | 'concrete', Record<string, Record<string, number>>>;

export async function fetchMaterialProperties(
  member: string, grade: string, constants: BridgeConstants, signal?: AbortSignal,
): Promise<MaterialProperties> {
  const concrete = member === constants.KEY_DECK_CONCRETE_GRADE_BASIC;
  const template = concrete ? 'DECK' : 'GIRDER';
  const properties = concrete
    ? { FCK: 'fck', FCTM: 'fctm', ECM: 'Ecm' }
    : { FY: 'Fy', FU: 'Fu', E: 'E', POISSON: 'Poisson' };
  const { data } = await apiClient.get<Catalogue>('/materials/base-values', { signal });
  const normalize = (name: string) => name.replace(/\s/g, '').toUpperCase();
  const catalogue = data[concrete ? 'concrete' : 'steel'];
  const values = Object.entries(catalogue).find(([name]) => normalize(name) === normalize(grade))?.[1];
  if (!values) throw new Error('Material grade was not found in Core.');

  // Core owns field keys/labels; this mapping only pairs them with stored catalogue columns.
  const fields = Object.entries(properties).map(([name, column]) => {
    const id = constants[`KEY_MATERIAL_${template}_${name}`];
    const label = constants[`DISP_MATERIAL_${template}_${name}`];
    if (typeof id !== 'string' || typeof label !== 'string' || !Number.isFinite(values[column])) {
      throw new Error('Core material information is incomplete.');
    }
    return { id, label, label_html: true, type: 'textbox', precision: name === 'POISSON' ? 2 : 1, column };
  });
  return { material: grade, fields, values: Object.fromEntries(fields.map(field => [field.id, values[field.column]])) };
}
