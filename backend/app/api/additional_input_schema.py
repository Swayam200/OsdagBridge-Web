from fastapi import APIRouter
from typing import List
from app.models.schemas import AdditionalInputTab

router = APIRouter(prefix="/schema", tags=["Schema"])
@router.get("/additional", response_model=List[AdditionalInputTab])
def additional_input_schema():
    try:
        from osdagbridge_core.bridge_types.plate_girder.ui_fields_additional_input import ADDITIONAL_INPUTS_SCHEMA
        return ADDITIONAL_INPUTS_SCHEMA
    except ImportError as e:
            print("CORE IMPORT ERROR:", e)
            raise
