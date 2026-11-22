/**
 * ProjectLocationModal.tsx
 *
 * Port of desktop osdagbridge_desktop.ui.dialogs.project_location.ProjectLocationDialog.
 *
 * Three input methods (radio toggle; switching clears the other methods' state):
 *   - Enter Location Name: State → District (only districts with IRC 6 data).
 *   - Select on Map: click the map or type Latitude/Longitude (700 ms debounce);
 *     values come from the IRC 6 zone shapefiles + nearest weather station.
 *   - Input Custom Data: wind speed, seismic zone (Z shown), min/max temperature.
 * The right card shows the IRC 6 values and the resolved City/State live.
 *
 * Save mirrors validate_and_save(); the result mirrors get_selected_location() and
 * is stored under KEY_PROJECT_LOCATION. Reopening restores the saved selection
 * (desktop session state); Cancel/close discards changes.
 * All data and validation come from osdagbridge_core via /api/v1/location/*.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import {
  fetchLocationStates,
  fetchLocationDistricts,
  fetchDistrictWeather,
  fetchCoordinateLookup,
  validateCustomWeatherData,
  validateMapCoordinates,
} from '../../services/api';
import { CoordinateLookup, LocationMethod, ProjectLocation, WeatherData } from '../../types/location';
import { CustomTitleBar } from './CustomTitleBar';
import { NativeMapWidget, NativeMapHandle } from '../widgets/NativeMapWidget';

const METHODS: { id: LocationMethod; label: string }[] = [
  { id: 'location_name', label: 'Enter Location Name' },
  { id: 'map', label: 'Select on Map' },
  { id: 'custom_data', label: 'Input Custom Data' },
];

const ZONE_CHOICES = ['Select Zone', 'II', 'III', 'IV', 'V'];
const ZONE_TO_Z: Record<string, string> = { II: '0.10', III: '0.16', IV: '0.24', V: '0.36' };

type CustomFields = { wind_speed: string; zone: string; max_temp: string; min_temp: string };
const EMPTY_CUSTOM: CustomFields = { wind_speed: '', zone: ZONE_CHOICES[0], max_temp: '', min_temp: '' };

type LocationDisplay = { city: string | null; state: string | null };
const NO_DISPLAY: LocationDisplay = { city: null, state: null };

const noop = () => {};

// Field styles matching the input dock (SchemaField) fields.
const INPUT_CLASS =
  'h-7 min-h-[28px] py-0.5 px-2 text-xs border border-input-border rounded-[5px] bg-input text-main outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus';
const SELECT_CLASS = `${INPUT_CLASS} pr-7 cursor-pointer appearance-none bg-[image:var(--select-arrow)] bg-no-repeat bg-[right_6px_center] bg-[length:16px_16px]`;
const BUTTON_CLASS =
  'min-w-[90px] h-8 px-4 text-xs font-semibold rounded-[5px] border border-main bg-surface text-main cursor-pointer select-none transition-colors hover:bg-accent hover:border-accent hover:text-white';

/** Python float() for the coordinate fields: NaN when blank or not numeric. */
const toFloat = (text: string) => (text.trim() === '' ? NaN : Number(text));

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));
const dash = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value));
const joinPlace = (a: string, b: string) => (a && b ? `${a}, ${b}` : a || b || '');

/** Live custom-data preview (_apply_custom_data_live): null while incomplete. */
function buildCustomWeather(c: CustomFields): WeatherData | null {
  const wind = c.wind_speed.trim();
  const maxT = c.max_temp.trim();
  const minT = c.min_temp.trim();
  if (!wind || !maxT || !minT || c.zone === ZONE_CHOICES[0]) return null;
  return { wind_speed: wind, zone: c.zone, z_value: ZONE_TO_Z[c.zone] ?? '', max_temp: maxT, min_temp: minT };
}

export const ProjectLocationModal: React.FC = () => {
  const isOpen = useBridgeStore((s) => s.isLocationModalOpen);
  // Mounted per opening so every open starts from the saved selection.
  return isOpen ? <ProjectLocationDialog /> : null;
};

const ProjectLocationDialog: React.FC = () => {
  const constants = useBridgeStore((s) => s.constants);
  const updateField = useBridgeStore((s) => s.updateField);
  const setLocationModalOpen = useBridgeStore((s) => s.setLocationModalOpen);
  const showMessage = useBridgeStore((s) => s.showInputErrorDialog);
  const locationKey = constants ? String(constants.KEY_PROJECT_LOCATION ?? '') : '';

  const [method, setMethod] = useState<LocationMethod>('location_name');
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [showBoundary, setShowBoundary] = useState(true);
  const [custom, setCustom] = useState<CustomFields>(EMPTY_CUSTOM);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [display, setDisplay] = useState<LocationDisplay>(NO_DISPLAY);

  const mapRef = useRef<NativeMapHandle>(null);
  const coordTimer = useRef<number | undefined>(undefined);
  // Only the latest lookup may update the dialog (desktop lookups are synchronous).
  const requestId = useRef(0);

  const close = () => setLocationModalOpen(false);

  // ── Restore saved selection (_restore_session_state) ─────────────────────
  useEffect(() => {
    const saved = (locationKey ? useBridgeStore.getState().inputs[locationKey] : undefined) as
      | ProjectLocation
      | undefined;
    const savedData = saved?.data ?? {};
    let active = true;

    (async () => {
      const stateList = await fetchLocationStates();
      const restoredState =
        saved?.method === 'location_name' && stateList.includes(savedData.state) ? savedData.state : stateList[0];
      const districtList = await fetchLocationDistricts(restoredState);
      if (!active) return;

      setStates(stateList);
      setSelectedState(restoredState);
      setDistricts(districtList);
      setSelectedDistrict(
        saved?.method === 'location_name' && districtList.includes(savedData.district)
          ? savedData.district
          : districtList[0],
      );

      const customData = saved?.custom_weather_data ?? saved?.weather_data;
      if (saved?.method === 'custom_data' && customData) {
        setMethod('custom_data');
        setCustom({
          wind_speed: text(customData.wind_speed),
          zone: ZONE_CHOICES.includes(text(customData.zone)) ? text(customData.zone) : ZONE_CHOICES[0],
          max_temp: text(customData.max_temp),
          min_temp: text(customData.min_temp),
        });
        setWeather(saved.weather_data);
      } else if (saved?.method === 'location_name' && Object.keys(savedData).length) {
        setDisplay({ city: savedData.district, state: savedData.state });
        setWeather(saved.weather_data);
      } else if (saved?.method === 'map' && Object.keys(savedData).length) {
        setMethod('map');
        setShowBoundary(false);
        setLatitude(savedData.latitude ?? '');
        setLongitude(savedData.longitude ?? '');
        const lat = toFloat(savedData.latitude ?? '');
        const lon = toFloat(savedData.longitude ?? '');
        if (Number.isFinite(lat) && Number.isFinite(lon)) mapRef.current?.setMarkerLocation(lat, lon);
        setDisplay({ city: savedData.station || null, state: savedData.state || null });
        setWeather(saved.weather_data);
      }
    })();

    return () => {
      active = false;
      window.clearTimeout(coordTimer.current);
    };
  }, [locationKey]);

  // Escape closes like QDialog.reject (unless a message box is on top).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useBridgeStore.getState().inputErrorDialog) close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // ── Clearing helpers ───────────────────────────────────────────────────────
  const clearWeatherState = () => {
    requestId.current++;
    window.clearTimeout(coordTimer.current);
    setWeather(null);
  };

  const clearMapSelection = () => {
    mapRef.current?.clearMarker();
    setLatitude('');
    setLongitude('');
  };

  /** Reset State/District to their placeholders (first items). */
  const clearLocationSelection = () => {
    setSelectedState(states[0] ?? '');
    setDistricts((list) => list.slice(0, 1));
    setSelectedDistrict(districts[0] ?? '');
  };

  // ── Method toggle (_set_active_method) ─────────────────────────────────────
  const setActiveMethod = (next: LocationMethod) => {
    clearWeatherState();
    clearMapSelection();
    if (next !== 'location_name') clearLocationSelection();
    if (next === 'custom_data') setCustom(EMPTY_CUSTOM);
    if (next === 'map') setShowBoundary(false);
    setDisplay(NO_DISPLAY);
    setMethod(next);
  };

  // ── Location name (_on_state_changed / _on_district_changed) ──────────────
  const handleStateChange = async (state: string) => {
    setSelectedState(state);
    setDistricts((list) => list.slice(0, 1));
    setSelectedDistrict(districts[0] ?? '');
    clearWeatherState();
    setDisplay(NO_DISPLAY);
    const id = requestId.current;
    const list = await fetchLocationDistricts(state);
    if (id !== requestId.current) return;
    setDistricts(list);
    setSelectedDistrict(list[0]);
  };

  const handleDistrictChange = async (district: string) => {
    setSelectedDistrict(district);
    clearWeatherState();
    if (districts.indexOf(district) <= 0) {
      setDisplay(NO_DISPLAY);
      return;
    }
    const id = requestId.current;
    const result = await fetchDistrictWeather(selectedState, district);
    if (id !== requestId.current) return;
    clearMapSelection();
    setWeather(result);
    setDisplay({ city: district, state: selectedState });
  };

  // ── Map (_lookup_zones_for_coordinates and friends) ───────────────────────
  const lookupCoordinates = async (lat: number, lon: number): Promise<CoordinateLookup | null> => {
    const id = ++requestId.current;
    const result = await fetchCoordinateLookup(lat, lon);
    if (id !== requestId.current) return null;

    if (!result.weather) {
      showMessage('Data for this location is not available.\n (Outside of India)', noop, {
        title: 'Location Error',
        type: 'critical',
      });
      clearMapSelection();
      setWeather(null);
      setDisplay(NO_DISPLAY);
      return null;
    }
    clearLocationSelection();
    setWeather(result.weather);
    setDisplay({ city: result.station, state: result.state });
    return result;
  };

  const handleMapLocationSelected = (lat: number, lon: number) => {
    window.clearTimeout(coordTimer.current);
    setLatitude(lat.toFixed(6));
    setLongitude(lon.toFixed(6));
    lookupCoordinates(lat, lon);
  };

  /** Typing clears the pin at once; the lookup runs 700 ms after the last keystroke. */
  const handleCoordinateChange = (latText: string, lonText: string) => {
    setLatitude(latText);
    setLongitude(lonText);
    mapRef.current?.clearMarker();
    window.clearTimeout(coordTimer.current);
    coordTimer.current = window.setTimeout(() => {
      const lat = toFloat(latText);
      const lon = toFloat(lonText);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        mapRef.current?.setMarkerLocation(lat, lon);
        lookupCoordinates(lat, lon);
      } else {
        clearWeatherState();
        setDisplay(NO_DISPLAY);
      }
    }, 700);
  };

  // ── Custom data ────────────────────────────────────────────────────────────
  const handleCustomChange = (field: keyof CustomFields, value: string) => {
    const next = { ...custom, [field]: value };
    setCustom(next);
    setWeather(buildCustomWeather(next));
  };

  // ── Save (validate_and_save → get_selected_location) ──────────────────────
  const handleSave = async () => {
    let current = weather;
    let place = display;

    if (method === 'custom_data') {
      const result = await validateCustomWeatherData({
        wind_speed: custom.wind_speed.trim(),
        zone: custom.zone,
        max_temp: custom.max_temp.trim(),
        min_temp: custom.min_temp.trim(),
      });
      if (!result.valid) {
        showMessage(result.message ?? '', noop, { title: 'Validation Error' });
        return;
      }
      current = buildCustomWeather(custom);
    } else if (method === 'map') {
      const lat = latitude.trim();
      const lon = longitude.trim();
      const result = await validateMapCoordinates(lat, lon);
      if (!result.valid) {
        showMessage(result.message ?? '', noop, { title: 'Validation Error' });
        return;
      }
      if (!current) {
        const lookup = await lookupCoordinates(Number(lat), Number(lon));
        if (!lookup) return;
        current = lookup.weather;
        place = { city: lookup.station, state: lookup.state };
      }
    }

    if (!current) {
      showMessage('Please select a location either on the map or from the dropdown menu.', noop, {
        title: 'Incomplete Data',
      });
      return;
    }

    const missing: string[] = [];
    if (!current.wind_speed && current.wind_speed !== 0) missing.push('Wind Speed');
    if (!current.zone) missing.push('Seismic Zone');
    if (current.max_temp == null || current.min_temp == null) missing.push('Temperature');
    if (missing.length) {
      showMessage(
        `Missing data: ${missing.join(', ')}.\nPlease select a different location or use Custom Data to enter values manually.`,
        noop,
        { title: 'Incomplete Data' },
      );
      return;
    }

    let location: ProjectLocation;
    if (method === 'location_name') {
      location = {
        method,
        data: { state: selectedState, district: selectedDistrict },
        weather_data: current,
        display_text: joinPlace(selectedDistrict, selectedState),
        show_display: Boolean(selectedDistrict || selectedState),
      };
    } else if (method === 'map') {
      const station = place.city ?? '';
      const state = place.state ?? '';
      location = {
        method,
        data: { latitude, longitude, station, state },
        weather_data: current,
        display_text: joinPlace(station, state),
        show_display: Boolean(station || state),
      };
    } else {
      location = {
        method,
        data: {},
        weather_data: current,
        display_text: 'Custom Data',
        show_display: true,
        custom_weather_data: current,
      };
    }

    updateField(locationKey, location);
    close();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const isCustom = method === 'custom_data';
  // QStackedWidget: every page shares one grid cell, so the card keeps the largest page size.
  const pageClass = (active: boolean) =>
    `col-start-1 row-start-1 min-w-0 flex flex-col gap-2.5 ${active ? '' : 'invisible'}`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-location-title"
        className="flex flex-col w-[780px] min-w-[780px] min-h-[520px] max-w-[95vw] max-h-[95vh] resize overflow-hidden bg-surface border border-accent shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs text-main"
      >
        <CustomTitleBar title="Project Location" titleId="project-location-title" onClose={close} />

        <div className="flex-1 min-h-0 flex flex-col gap-3 px-[18px] pt-[18px] pb-3.5">
          {/* Method toggle */}
          <div className="flex gap-[18px]" role="radiogroup" aria-label="Location input method">
            {METHODS.map((m) => (
              <label key={m.id} className="group inline-flex items-center gap-2 py-1.5 cursor-pointer select-none">
                {/* Desktop CustomRadioButton: 15px ring (grey, green on hover);
                    checked = solid #2e7d32 with a 9px white dot */}
                <input
                  type="radio"
                  name="project-location-method"
                  checked={method === m.id}
                  onChange={() => setActiveMethod(m.id)}
                  className="appearance-none shrink-0 w-[15px] h-[15px] m-0 rounded-full border-2 border-[#9e9e9e] bg-white cursor-pointer group-hover:border-[#2e7d32] checked:border-[#2e7d32] checked:bg-[radial-gradient(circle,#ffffff_0_4.5px,#2e7d32_5px)]"
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>

          <div className="flex-1 min-h-0 flex gap-3.5">
            {/* Left card: design code + method pages */}
            <div className="flex-[2] min-w-0 flex flex-col gap-3 px-3.5 py-3 bg-surface border border-border rounded-[10px]">
              {!isCustom && (
                <div className="flex items-center gap-2.5">
                  <label htmlFor="location-design-code" className="font-semibold">
                    Design Code
                  </label>
                  <select id="location-design-code" className={`${SELECT_CLASS} w-[200px]`}>
                    <option>IRC 6 (2017)</option>
                  </select>
                </div>
              )}

              <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1fr)]">
                {/* Enter Location Name */}
                <div className={`${pageClass(method === 'location_name')} p-0.5`}>
                  <div className="font-bold">Search by location name</div>
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="location-state">State</label>
                      <select
                        id="location-state"
                        className={SELECT_CLASS}
                        value={selectedState}
                        onChange={(e) => handleStateChange(e.target.value)}
                      >
                        {states.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="location-district">District</label>
                      <select
                        id="location-district"
                        className={SELECT_CLASS}
                        value={selectedDistrict}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                      >
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="italic text-muted">
                    Note: Only districts with data available in IRC 6 (2017) are listed.
                  </div>
                </div>

                {/* Select on Map */}
                <div className={`${pageClass(method === 'map')} gap-1.5 bg-grouped`}>
                  <div className="flex items-center gap-2.5 px-2 pt-1">
                    <span>Map Options:</span>
                    <label className="inline-flex items-center gap-2 py-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showBoundary}
                        onChange={(e) => setShowBoundary(e.target.checked)}
                        className="w-4 h-4 m-0 accent-accent cursor-pointer"
                      />
                      <span>Show India boundary overlay</span>
                    </label>
                  </div>

                  <NativeMapWidget
                    ref={mapRef}
                    onLocationSelected={handleMapLocationSelected}
                    showBoundary={showBoundary}
                  />

                  <div className="flex flex-col gap-1.5 p-2.5 bg-surface border-t border-border">
                    <div className="font-bold">Enter Coordinates or Select on Map</div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 flex flex-col gap-1">
                        <label htmlFor="location-latitude">Latitude (°)</label>
                        <input
                          id="location-latitude"
                          className={INPUT_CLASS}
                          placeholder="e.g. 28.6139"
                          value={latitude}
                          onChange={(e) => handleCoordinateChange(e.target.value, longitude)}
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <label htmlFor="location-longitude">Longitude (°)</label>
                        <input
                          id="location-longitude"
                          className={INPUT_CLASS}
                          placeholder="e.g. 77.2090"
                          value={longitude}
                          onChange={(e) => handleCoordinateChange(latitude, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Custom Data */}
                <div className={`${pageClass(isCustom)} p-0.5`}>
                  <div className="font-bold">Enter Custom Weather Data</div>
                  <div className="flex items-center gap-2.5">
                    <label htmlFor="location-custom-wind" className="w-[200px] shrink-0">
                      Basic Wind Speed (m/s)
                    </label>
                    <input
                      id="location-custom-wind"
                      className={`${INPUT_CLASS} flex-1`}
                      placeholder="e.g. 50"
                      value={custom.wind_speed}
                      onChange={(e) => handleCustomChange('wind_speed', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <label htmlFor="location-custom-zone" className="w-[200px] shrink-0">
                      Seismic Zone
                    </label>
                    <select
                      id="location-custom-zone"
                      className={`${SELECT_CLASS} flex-1`}
                      value={custom.zone}
                      onChange={(e) => handleCustomChange('zone', e.target.value)}
                    >
                      {ZONE_CHOICES.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                    <input
                      className={`${INPUT_CLASS} w-[100px] bg-input-disabled text-input-disabled-text border-border`}
                      aria-label="Zone Factor (Z)"
                      placeholder="Zone Factor (Z)"
                      value={ZONE_TO_Z[custom.zone] ?? ''}
                      readOnly
                    />
                  </div>
                  <div>Shade Air Temperature (°C)</div>
                  <div className="flex items-center gap-2.5">
                    <input
                      className={`${INPUT_CLASS} flex-1`}
                      aria-label="Min Shade Air Temperature (°C)"
                      placeholder="Min"
                      value={custom.min_temp}
                      onChange={(e) => handleCustomChange('min_temp', e.target.value)}
                    />
                    <input
                      className={`${INPUT_CLASS} flex-1`}
                      aria-label="Max Shade Air Temperature (°C)"
                      placeholder="Max"
                      value={custom.max_temp}
                      onChange={(e) => handleCustomChange('max_temp', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right card: IRC values + resolved location */}
            <div
              className="flex-1 flex flex-col gap-2 px-3.5 py-3 bg-grouped border border-accent rounded-[10px]"
              aria-live="polite"
            >
              <div className="font-bold text-accent">{isCustom ? 'Custom Values:' : 'IRC 6 (2017) Values:'}</div>
              <div>Basic Wind Speed (m/sec): {dash(weather?.wind_speed)}</div>
              <div className="whitespace-pre">
                Seismic Zone: {weather?.zone || '—'}    Z = {dash(weather?.z_value)}
              </div>
              <div>
                Shade Air Temperature (°C): {dash(weather?.max_temp)} / {dash(weather?.min_temp)}
              </div>

              {(display.city || display.state) && (
                <>
                  <div className="font-bold text-accent mt-1.5">Location:</div>
                  <div>City: {display.city || '—'}</div>
                  <div>State: {display.state || '—'}</div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-1.5">
            <button type="button" className={BUTTON_CLASS} onClick={handleSave}>
              Save
            </button>
            <button type="button" className={BUTTON_CLASS} onClick={close}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
