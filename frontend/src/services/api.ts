/**
 * services/api.ts
 *
 * Client API services for connecting the frontend to the FastAPI backend.
 * Uses Vite /api/v1 proxy or VITE_API_BASE_URL environment variable.
 *
 * Endpoints:
 *   - GET  /constants         -> fetchConstants  (KEY_* / TYPE_* from backend)
 *   - GET  /schema            -> fetchBasicSchema (throws on backend failure)
 *   - POST /validate          -> validateField
 *   - GET  /location/states   -> fetchLocationStates
 *   - GET  /location/stations -> fetchLocationStations
 *   - GET  /location/details  -> fetchLocationDetails
 *   - GET  /materials/steel   -> fetchSteelMaterials
 *   - GET  /materials/concrete-> fetchConcreteMaterials
 *   - GET  /sections/rolled   -> fetchRolledSections
 *
 * All material, section, and location data is fetched directly from the backend
 */

import axios from 'axios';
import { UIFieldSchema, ValidateFieldResponse, BridgeConstants } from '../types/schema';
import { LocationData } from '../types/location';

export const apiClient = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_BASE_URL as string) || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export let isBackendAvailable = false;

export interface SteelMaterial {
  name: string;
  fy?: number;
  fu?: number;
  E?: number;
}

export interface ConcreteMaterial {
  grade: string;
  fck?: number;
  Ecm?: number;
}

export interface RolledSection {
  designation: string;
  type?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSchemaField(value: unknown): value is UIFieldSchema {
  if (!value || typeof value !== 'object') return false;
  const field = value as Record<string, unknown>;
  return typeof field.key === 'string' && typeof field.ui_type === 'string';
}

/**
 * Augments raw schema fields with frontend presentation enhancements.
 * Uses backend-provided constants for key comparisons -
 */
export function normalizeSchemaPayload(
  data: unknown,
  constants?: BridgeConstants,
): UIFieldSchema[] {
  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['fields', 'schema', 'basic', 'input_fields', 'ui_fields']) {
      if (Array.isArray(obj[key])) {
        list = obj[key] as unknown[];
        break;
      }
    }
  }

  if (list.length === 0 || !list.every(isSchemaField)) {
    throw new Error('Schema payload contains invalid field definitions');
  }

  // Resolve keys directly from backend constants.
  const KEY_STRUCTURE_TYPE    = constants ? String(constants.KEY_STRUCTURE_TYPE ?? '') : '';
  const KEY_DESIGN_MODE       = constants ? String(constants.KEY_DESIGN_MODE ?? '') : '';
  const KEY_PROJECT_LOCATION  = constants ? String(constants.KEY_PROJECT_LOCATION ?? '') : '';
  const KEY_CARRIAGEWAY_WIDTH = constants ? String(constants.KEY_CARRIAGEWAY_WIDTH ?? '') : '';
  const KEY_ADDITIONAL_BTN    = constants ? String(constants.KEY_ADDITIONAL_BTN ?? '') : '';
  const girderKey             = constants ? String(constants.KEY_MATERIAL_GIRDER ?? '') : '';
  const MATERIAL_PREFIX       = girderKey.includes('.') ? girderKey.slice(0, girderKey.lastIndexOf('.') + 1) : '';

  // Augment fields with presentation enhancements.
  return (list as UIFieldSchema[]).map((field) => {
    if (KEY_STRUCTURE_TYPE && field.key === KEY_STRUCTURE_TYPE) {
      return {
        ...field,
        disabled_options: ['Other'],
      };
    }
    if (KEY_DESIGN_MODE && field.key === KEY_DESIGN_MODE) {
      return {
        ...field,
        show_group_title: false,
        default: 'Custom',
        disabled_options: ['Optimized'],
      };
    }
    if (KEY_PROJECT_LOCATION && field.key === KEY_PROJECT_LOCATION) {
      return {
        ...field,
        show_group_title: false,
        button_label: field.button_label || 'Select Location',
        post_row: field.post_row || { kind: 'info_row' },
      };
    }
    if (KEY_CARRIAGEWAY_WIDTH && field.key === KEY_CARRIAGEWAY_WIDTH) {
      return {
        ...field,
        placeholder: field.placeholder || '4.25-23.6 m',
      };
    }
    const isAdditionalBtn = Boolean(
      (KEY_ADDITIONAL_BTN && field.key === KEY_ADDITIONAL_BTN) ||
      field.key === 'geometry.additional_btn' ||
      field.key.includes('additional_btn') ||
      field.action === 'show_additional_inputs' ||
      (field.label && field.label.toLowerCase().includes('additional geometry'))
    );

    if (isAdditionalBtn) {
      return {
        ...field,
        group: 'Additional Geometry',
        show_group_title: false,
        button_label: 'Modify Here',
      };
    }

    const isMaterial =
      Boolean(field.is_material_field) ||
      (MATERIAL_PREFIX && field.key.startsWith(MATERIAL_PREFIX)) ||
      (constants && (
        field.key === String(constants.KEY_GIRDER ?? '') ||
        field.key === String(constants.KEY_CROSS_BRACING ?? '') ||
        field.key === String(constants.KEY_END_DIAPHRAGM ?? '') ||
        field.key === String(constants.KEY_DECK_CONCRETE_GRADE_BASIC ?? '') ||
        field.key === String(constants.KEY_MATERIAL_GIRDER ?? '') ||
        field.key === String(constants.KEY_MATERIAL_CROSS_BRACING ?? '') ||
        field.key === String(constants.KEY_MATERIAL_END_DIAPHRAGM ?? '') ||
        field.key === String(constants.KEY_MATERIAL_DECK ?? '')
      )) ||
      field.key.toLowerCase().includes('material') ||
      Boolean(field.group && field.group.toLowerCase().includes('material'));

    if (isMaterial) {
      return {
        ...field,
        is_material_field: true,
      };
    }
    return field;
  });
}

function listFromUnknown(data: unknown, keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // If backend returns a dictionary mapping grade name to properties
    const entries = Object.entries(obj).map(([key, val]) => {
      if (val && typeof val === 'object') {
        return { name: key, grade: key, ...(val as Record<string, unknown>) };
      }
      return { name: key, grade: key };
    });
    if (entries.length > 0) return entries;
  }
  return [];
}

// ── Public API Functions ──────────────────────────────────────────────────────

/**
 * Fetch all KEY_* and TYPE_* constants from GET /api/v1/constants.
 * This is the single source of truth for canonical schema key strings.
 * Throws on failure — the caller must show a clear error state.
 */
export async function fetchConstants(): Promise<BridgeConstants> {
  const res = await apiClient.get('/constants');
  if (!res.data || typeof res.data !== 'object' || Array.isArray(res.data)) {
    throw new Error('Invalid constants response from backend.');
  }
  return res.data as BridgeConstants;
}

/**
 * Fetch the basic input schema from GET /api/v1/schema.
 * When backend is unavailable, errors are thrown to the caller so the UI
 * can remain unloaded and display a clear, user-friendly offline message.
 */
export async function fetchBasicSchema(constants?: BridgeConstants): Promise<UIFieldSchema[]> {
  try {
    const res = await apiClient.get('/schema');
    const fields = normalizeSchemaPayload(res.data, constants);
    if (fields.length === 0) {
      throw new Error('Empty schema payload received from backend.');
    }
    isBackendAvailable = true;
    return fields;
  } catch (error) {
    isBackendAvailable = false;
    throw error;
  }
}

/**
 * Fetch environmental/weather constraints for a station from GET /api/v1/location/details.
 * Directly queries backend; returns null if unavailable.
 */
export async function fetchLocationDetails(state = 'Delhi', station = 'New Delhi'): Promise<LocationData | null> {
  try {
    const res = await apiClient.get<LocationData>('/location/details', {
      params: { state, station },
    });
    if (res.data && res.data.state && res.data.station) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.warn('Backend location details unavailable:', error);
    return null;
  }
}

/**
 * Fetch Indian states from GET /api/v1/location/states.
 * Directly queries backend; returns empty list if unavailable.
 */
export async function fetchLocationStates(): Promise<string[]> {
  try {
    const res = await apiClient.get<{ states: string[] }>('/location/states');
    return res.data?.states || [];
  } catch (error) {
    console.warn('Backend states unavailable:', error);
    return [];
  }
}

/**
 * Fetch stations for a given state from GET /api/v1/location/stations.
 * Directly queries backend; returns empty list if unavailable.
 */
export async function fetchLocationStations(state: string): Promise<string[]> {
  try {
    const res = await apiClient.get<{ state: string; stations: string[] }>('/location/stations', {
      params: { state },
    });
    return res.data?.stations || [];
  } catch (error) {
    console.warn('Backend stations unavailable:', error);
    return [];
  }
}

/**
 * Fetch available steel material grades from GET /api/v1/materials/steel.
 * Directly queries backend; returns empty list if unavailable.
 */
export async function fetchSteelMaterials(): Promise<SteelMaterial[]> {
  try {
    const res = await apiClient.get('/materials/steel');
    const rows = listFromUnknown(res.data, ['items', 'materials', 'steel', 'grades']);
    const mapped = rows
      .map((row) => {
        if (typeof row === 'string') return { name: row };
        if (row && typeof row === 'object') {
          const r = row as Record<string, unknown>;
          const name = String(r.name ?? r.grade ?? r.designation ?? '');
          if (!name) return null;
          return {
            name,
            fy: typeof r.fy === 'number' ? r.fy : typeof r.Fy === 'number' ? r.Fy : undefined,
            fu: typeof r.fu === 'number' ? r.fu : typeof r.Fu === 'number' ? r.Fu : undefined,
            E: typeof r.E === 'number' ? r.E : undefined,
          } as SteelMaterial;
        }
        return null;
      })
      .filter((m): m is SteelMaterial => Boolean(m));
    return mapped;
  } catch (error) {
    console.warn('Backend steel materials unavailable:', error);
    return [];
  }
}

/**
 * Fetch available concrete material grades from GET /api/v1/materials/concrete.
 * Directly queries backend; returns empty list if unavailable.
 */
export async function fetchConcreteMaterials(): Promise<ConcreteMaterial[]> {
  try {
    const res = await apiClient.get('/materials/concrete');
    const rows = listFromUnknown(res.data, ['items', 'materials', 'concrete', 'grades']);
    const mapped = rows
      .map((row) => {
        if (typeof row === 'string') return { grade: row };
        if (row && typeof row === 'object') {
          const r = row as Record<string, unknown>;
          const grade = String(r.grade ?? r.name ?? '');
          if (!grade) return null;
          return {
            grade,
            fck: typeof r.fck === 'number' ? r.fck : undefined,
            Ecm: typeof r.Ecm === 'number' ? r.Ecm : typeof r.Ec === 'number' ? r.Ec : undefined,
          } as ConcreteMaterial;
        }
        return null;
      })
      .filter((m): m is ConcreteMaterial => Boolean(m));
    return mapped;
  } catch (error) {
    console.warn('Backend concrete materials unavailable:', error);
    return [];
  }
}

/**
 * Fetch rolled steel sections from GET /api/v1/sections/rolled.
 * Directly queries backend; returns empty list if unavailable.
 */
export async function fetchRolledSections(): Promise<RolledSection[]> {
  try {
    const res = await apiClient.get('/sections/rolled');
    const rows = listFromUnknown(res.data, ['items', 'sections', 'rolled']);
    const mapped = rows
      .map((row) => {
        if (typeof row === 'string') return { designation: row };
        if (row && typeof row === 'object') {
          const r = row as Record<string, unknown>;
          const designation = String(r.designation ?? r.name ?? r.section ?? '');
          if (!designation) return null;
          return {
            designation,
            type: typeof r.type === 'string' ? r.type : undefined,
          } as RolledSection;
        }
        return null;
      })
      .filter((s): s is RolledSection => Boolean(s));
    return mapped;
  } catch (error) {
    console.warn('Backend rolled sections unavailable:', error);
    return [];
  }
}

/** Display-only — no additional inputs content in UI preview mode. */
export async function fetchAdditionalInputsSchema(): Promise<unknown[]> {
  return [];
}

/**
 * Validate a single field value against IRC / Osdag design constraints.
 * Calls POST /api/v1/validate with { key, value, all_inputs }.
 * Returns the backend ValidateFieldResponse ({ valid, message, corrected_value }).
 * Returns null if the backend is unreachable (network error).
 */
export async function validateField(
  key: string,
  value: unknown,
  allInputs: Record<string, unknown> = {},
): Promise<ValidateFieldResponse | null> {
  try {
    const res = await apiClient.post<ValidateFieldResponse>('/validate', {
      key,
      value,
      all_inputs: allInputs,
    });
    return res.data;
  } catch (error) {
    // Validation errors from the backend are always 200 responses;
    // a network/5xx error means the validator is unavailable — do not block the user.
    console.warn('Validation endpoint unavailable:', error);
    return null;
  }
}
