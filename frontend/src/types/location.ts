/**
 * Project location types — mirror the dict built by desktop
 * ProjectLocationDialog.get_selected_location(), stored in the inputs under
 * KEY_PROJECT_LOCATION ("project.location").
 */

export type LocationMethod = 'location_name' | 'map' | 'custom_data';

/** IRC 6 values (desktop weather dict). Custom data keeps the typed strings. */
export interface WeatherData {
  wind_speed: number | string | null;
  zone: string | null;
  z_value: number | string | null;
  max_temp: number | string | null;
  min_temp: number | string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** GET /location/coordinates — weather is null when data is unavailable (outside India). */
export interface CoordinateLookup {
  weather: WeatherData | null;
  station: string | null;
  state: string | null;
}

export interface ProjectLocation {
  method: LocationMethod;
  /** {state, district} | {latitude, longitude, station, state} | {} */
  data: Record<string, string>;
  weather_data: WeatherData | null;
  display_text: string;
  show_display: boolean;
  custom_weather_data?: WeatherData;
}
