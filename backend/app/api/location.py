"""
Project Location API.

Adapts osdagbridge_desktop.ui.dialogs.project_location.ProjectLocationDialog.
All data comes from osdagbridge_core (weather database + IRC:6 zone shapefiles);
each endpoint mirrors the desktop dialog method named in its docstring.
"""

from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from app.models.schemas import (
    LocationStateResponse,
    LocationDistrictResponse,
    WeatherData,
    CoordinateLookupResponse,
    CustomWeatherValidateRequest,
    CoordinatesValidateRequest,
    ValidateFieldResponse,
)

router = APIRouter(prefix="/location", tags=["Project Location"])


@router.get("/states", response_model=LocationStateResponse)
def get_states():
    """State list including the "Select State" placeholder (state_combo items)."""
    from osdagbridge_core.bridge_types.plate_girder.ui_fields_project_location import get_state_list
    return LocationStateResponse(states=get_state_list())


@router.get("/districts", response_model=LocationDistrictResponse)
def get_districts(state: str = Query(..., description="Name of the State")):
    """
    Districts with wind speed data, including the "Select District" placeholder.
    Mirrors ProjectLocationDialog._get_districts_with_complete_data.
    """
    from osdagbridge_core.bridge_types.plate_girder.ui_fields_project_location import get_station_list, get_weather
    from osdagbridge_core.data.project_location.zone_lookup import get_zones_for_coordinates

    all_districts = get_station_list(state, include_placeholder=True)
    valid_districts = [all_districts[0]]  # placeholder

    for district in all_districts[1:]:
        weather = get_weather(state, district)
        wind_speed = weather.get("wind_speed")

        # If missing from DB, try shapefile
        if wind_speed in (None, ""):
            lat = weather.get("latitude")
            lon = weather.get("longitude")
            if lat and lon:
                wind_speed = get_zones_for_coordinates(float(lat), float(lon)).get("wind_Vb")

        if wind_speed not in (None, ""):
            valid_districts.append(district)

    return LocationDistrictResponse(state=state, districts=valid_districts)


@router.get("/weather", response_model=WeatherData)
def get_district_weather(state: str = Query(...), district: str = Query(...)):
    """
    IRC 6 values for a district; missing zone/wind values are filled from the
    shapefiles using the station coordinates.
    Mirrors ProjectLocationDialog._on_district_changed.
    """
    from osdagbridge_core.bridge_types.plate_girder.ui_fields_project_location import get_weather
    from osdagbridge_core.data.project_location.zone_lookup import get_zones_for_coordinates

    weather = get_weather(state, district)

    if not weather.get("zone") or not weather.get("wind_speed"):
        lat = weather.get("latitude")
        lon = weather.get("longitude")
        if lat is not None and lon is not None:
            zone_data = get_zones_for_coordinates(float(lat), float(lon))

            if not weather.get("zone") and zone_data.get("seismic_zone"):
                weather["zone"] = zone_data.get("seismic_zone")
                if zone_data.get("zone_factor"):
                    weather["z_value"] = zone_data.get("zone_factor")

            if not weather.get("wind_speed") and zone_data.get("wind_Vb"):
                weather["wind_speed"] = zone_data.get("wind_Vb")

    return WeatherData(**weather)


@router.get("/coordinates", response_model=CoordinateLookupResponse)
def lookup_coordinates(lat: float = Query(...), lon: float = Query(...)):
    """
    IRC 6 values and nearest weather station for a map point.
    `weather` is null when any value is unavailable (outside India).
    Mirrors ProjectLocationDialog._lookup_zones_for_coordinates and
    _update_nearest_station_display.
    """
    from osdagbridge_core.data.project_location.zone_lookup import (
        get_zones_for_coordinates,
        get_temperature_for_coordinates,
    )

    zone_data = get_zones_for_coordinates(lat, lon)
    temp_data = get_temperature_for_coordinates(lat, lon)

    if (
        not zone_data.get("seismic_zone")
        or zone_data.get("wind_Vb") in (None, "")
        or temp_data.get("max_temp") is None
        or temp_data.get("min_temp") is None
    ):
        return CoordinateLookupResponse()

    return CoordinateLookupResponse(
        weather=WeatherData(
            wind_speed=zone_data.get("wind_Vb"),
            zone=zone_data.get("seismic_zone"),
            z_value=zone_data.get("zone_factor"),
            max_temp=temp_data.get("max_temp"),
            min_temp=temp_data.get("min_temp"),
        ),
        station=temp_data.get("nearest_station"),
        state=temp_data.get("nearest_state"),
    )


@router.post("/validate/custom-data", response_model=ValidateFieldResponse)
def validate_custom_data(payload: CustomWeatherValidateRequest):
    """BridgeInputValidator.validate_custom_weather_data (custom data Save)."""
    from osdagbridge_core.bridge_types.plate_girder.validator import BridgeInputValidator
    is_valid, message = BridgeInputValidator().validate_custom_weather_data(
        payload.wind_speed, payload.zone, payload.max_temp, payload.min_temp
    )
    return ValidateFieldResponse(valid=is_valid, message=message or None)


@router.post("/validate/coordinates", response_model=ValidateFieldResponse)
def validate_coordinates(payload: CoordinatesValidateRequest):
    """BridgeInputValidator.validate_map_coordinates (map Save)."""
    from osdagbridge_core.bridge_types.plate_girder.validator import BridgeInputValidator
    is_valid, message = BridgeInputValidator().validate_map_coordinates(payload.latitude, payload.longitude)
    return ValidateFieldResponse(valid=is_valid, message=message or None)


@router.get("/boundary")
def get_india_boundary():
    """India boundary GeoJSON drawn over the map (NativeMapWidget.load_geojson)."""
    from osdagbridge_core import PROJECT_LOCATION_DIR
    return FileResponse(PROJECT_LOCATION_DIR / "india-osm.geojson", media_type="application/geo+json")
