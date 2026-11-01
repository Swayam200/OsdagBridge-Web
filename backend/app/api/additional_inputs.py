"""HTTP contract for stateless Typical Section evaluation through the Web adapter."""
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from app.services.typical_section import evaluate

router = APIRouter(prefix='/additional-inputs', tags=['Additional Inputs'])


class EvaluationRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    inputs: dict[str, Any]
    changed_key: str | None = None
    validate_all: bool = False


class Issue(BaseModel):
    key: str
    message: str
    corrected_value: Any = None


class EvaluationResponse(BaseModel):
    values: dict[str, Any]
    issues: list[Issue]
    disabled: list[str]
    hidden: list[str]
    notices: list[str]


@router.post('/evaluate', response_model=EvaluationResponse)
def evaluate_typical_section(payload: EvaluationRequest):
    """Evaluate edits or a full Save; field issues remain in the response body."""
    try:
        return evaluate(payload.inputs, payload.changed_key, payload.validate_all)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
