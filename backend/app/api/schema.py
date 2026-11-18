from fastapi import APIRouter
from typing import List
from app.models.schemas import UIFieldSchema

router = APIRouter(prefix="/schema", tags=["Schema"])
@router.get("/basic", response_model=List[UIFieldSchema])
@router.get("", response_model=List[UIFieldSchema])
def get_basic_input_schema():
    """
    Returns the schema-driven definition of input fields for the Input Dock.
    """
    try:

        '''
            Field Observations:
                unit property is only there for type textbox
                options property is only there for dropdown/combox type
                all keys in the BASIC_INPUT_DICT have a deafult value
        '''
        from osdagbridge_core.bridge_types.plate_girder.ui_fields import FrontendData
        from osdagbridge_core.bridge_types.plate_girder.defaults import BASIC_INPUT_DICT
        from osdagbridge_core.utils.common import SPAN_MIN, SPAN_MAX, CARRIAGEWAY_WIDTH_MIN, CARRIAGEWAY_WIDTH_MIN_WITH_MEDIAN, CARRIAGEWAY_WIDTH_MAX_LIMIT, SKEW_ANGLE_MIN, SKEW_ANGLE_MAX, SKEW_ANGLE_DEFAULT


        fields = FrontendData().input_values()
        NEW_SCHEMA: List[UIFieldSchema] = []

        #dictionary containing the min and max values for different fields
        min_max_dict = {
            "geometry.span": {"min": SPAN_MIN, "max": SPAN_MAX},
            "geometry.carriageway_width": {"min": CARRIAGEWAY_WIDTH_MIN, "max": CARRIAGEWAY_WIDTH_MAX_LIMIT},
            "geometry.skew_angle": {"min": SKEW_ANGLE_MIN, "max": SKEW_ANGLE_MAX}
        }

        #dictionary containing the units for the different fields, derived from the Desktop version
        units_dict = {
            "geometry.span": "m",
            "geometry.carriageway_width": "m",
            "geometry.skew_angle": "°"
        }

        current_group = None
        for field in fields:

            schema_data = {  
                "key": field[0],
                "label": field[1],
                "ui_type": field[2],
                "default": field[6].get("default"),
                "min": None,
                "max": None,
                "unit": None,
                "container": field[6].get("container", "main"),
                "group": current_group,
                "options": [],
                "placeholder": field[6].get("placeholder"),
                "required": field[6].get("required", False),
                "action": field[6].get("action"),
                "visibility": field[4],
                "validator": field[5]
            }
            #Below as per the conditions values are omitted or included in the schema data

            #module type fields are skipped
            if(field[2] == "module"):
                continue

            #title fields are skipped after setting the current_group as their label
            if(field[2] == "title"):
                if(field[1]):
                    current_group = field[1] #the label
                continue

            #condition 1: If the field has a min, max value it is taken from the min_max_dict
            if(field[0] in min_max_dict):
                schema_data["min"] = min_max_dict[field[0]].get("min")
                schema_data["max"] = min_max_dict[field[0]].get("max")

            #condition 2: If the field has a unit then take it from the unit dictionary
            if(field[0]in units_dict):
                schema_data["unit"] = units_dict[field[0]]
            
            #condition 3: All fields in BASIC_INPUT_DICT have a default value
            if(field[0] in BASIC_INPUT_DICT): 
                schema_data["default"] = BASIC_INPUT_DICT[field[0]]

            #condition 4: If type is combobox then include options property
            if(field[2] == "combobox"):
                schema_data["options"] = field[3]

            #condition 5: Set the group as the current_group
            schema_data["group"] = current_group

            #As all values need to be included, unpack the dictionary and append into NEW_SCHEMA
            NEW_SCHEMA.append(UIFieldSchema(**schema_data))
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise
    return NEW_SCHEMA
