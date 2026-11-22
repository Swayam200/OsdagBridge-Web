from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union

#Changed label property to Optional[str] = None to accommodate module type ui fields with "None" as label
class UIFieldSchema(BaseModel):
    key: str
    label: Optional[str] = None
    ui_type: str = Field(..., description="'number' | 'text' | 'select' | 'button'")
    default: Optional[Union[float, int, str, bool]] = None
    min: Optional[float] = None
    max: Optional[float] = None
    unit: Optional[str] = None
    container: Optional[str] = "main"
    group: Optional[str] = "General"
    options: Optional[List[str]] = []
    placeholder: Optional[str] = None
    required: bool = False
    action: Optional[str] = None
    visibility: Optional[bool] = True
    validator: Optional[str ] = None

class AdditionalUiFieldSchema(BaseModel):  #validation for the top fields of additional inputs 
    model_config = ConfigDict(extra="allow") #allows any changes in the ui field to be reflected 

    id: str
    layout: Dict[str, Any]
    header: Optional[Dict[str, Any]] = None
    primary_fields: Optional[Dict[str, Any]] = None
    sections: Optional[List[Dict[str, Any]]] = None
    tabs: Optional[List[Dict[str, Any]]] = None

class AdditionalInputTab(BaseModel):  #validation for the additional input tab
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    label: str
    schema_: AdditionalUiFieldSchema = Field(alias="schema") #core sends schema therefore its mentioned as an alias here
    main_id: str
    filler_column_index: Optional[Any] = None
    with_scroll: Optional[bool] = None

class ValidateFieldRequest(BaseModel):
    key: str
    value: Any
    all_inputs: Dict[str, Any] = {}

class ValidateFieldResponse(BaseModel):
    valid: bool
    corrected_value: Optional[Any] = None
    message: Optional[str] = None

class LocationStateResponse(BaseModel):
    states: List[str]

class LocationDistrictResponse(BaseModel):
    state: str
    districts: List[str]

class WeatherData(BaseModel):
    """IRC 6 values in the desktop weather dict format (project.location -> weather_data)."""
    wind_speed: Optional[float] = Field(None, description="Basic wind speed V_b in m/s")
    zone: Optional[str] = Field(None, description="Seismic zone II, III, IV or V")
    z_value: Optional[float] = Field(None, description="Seismic zone factor Z")
    max_temp: Optional[float] = Field(None, description="Max shade air temperature in °C")
    min_temp: Optional[float] = Field(None, description="Min shade air temperature in °C")
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class CoordinateLookupResponse(BaseModel):
    weather: Optional[WeatherData] = None
    station: Optional[str] = None
    state: Optional[str] = None

class CustomWeatherValidateRequest(BaseModel):
    wind_speed: str
    zone: str
    max_temp: str
    min_temp: str

class CoordinatesValidateRequest(BaseModel):
    latitude: str
    longitude: str
