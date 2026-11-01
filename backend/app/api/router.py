from fastapi import APIRouter
from app.api.schema import router as schema_router
from app.api.materials import router as material_router
from app.api.validate import router as validate_router
from app.api.sections import router as sections_router
from app.api.additional_input_schema import router as additional_input_router
from app.api.location import router as location_router
from app.api.keys_and_constants import router as keys_constants_router
from app.api.additional_inputs import router as additional_inputs_router
from app.api.material_inputs import router as material_inputs_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(schema_router)
api_router.include_router(material_router)
api_router.include_router(validate_router)
api_router.include_router(sections_router)
api_router.include_router(location_router)
api_router.include_router(additional_input_router)
api_router.include_router(keys_constants_router)
api_router.include_router(additional_inputs_router)
api_router.include_router(material_inputs_router)
