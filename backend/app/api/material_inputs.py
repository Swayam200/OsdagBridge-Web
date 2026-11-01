"""Material dialog endpoints; existing steel/concrete grade-list routes stay separate."""
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from app.services import material_inputs

router = APIRouter(prefix='/materials', tags=['Materials'])


class MaterialRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    member: str
    values: dict[str, Any]
    changed_key: str | None = None
    validate_all: bool = False


class MaterialIssue(BaseModel):
    key: str
    message: str
    corrected_value: Any = None


class MaterialEvaluation(BaseModel):
    material: str
    values: dict[str, Any]
    issues: list[MaterialIssue]


@router.get('/properties')
def get_properties(member: str, grade: str):
    """Return property definitions/defaults for standard information or Custom."""
    try:
        return material_inputs.properties(member, grade)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post('/evaluate', response_model=MaterialEvaluation)
def evaluate(payload: MaterialRequest):
    """Evaluate a custom draft without adding it to server-side state."""
    try:
        return material_inputs.evaluate(payload.member, payload.values, payload.changed_key, payload.validate_all)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
