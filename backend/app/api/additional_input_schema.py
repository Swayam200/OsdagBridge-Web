from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.schemas import AdditionalInputTab

router = APIRouter(prefix="/schema", tags=["Schema"])

@router.get("/additional", response_model=List[AdditionalInputTab])
def additional_input_schema():
    try:
        from osdagbridge.core.bridge_types.plate_girder.ui_fields_additional_input import ADDITIONAL_INPUTS_SCHEMA
        return ADDITIONAL_INPUTS_SCHEMA
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise

class AdditionalDefaultsRequest(BaseModel):
    basic_inputs: Dict[str, Any] = {}

@router.post("/additional/defaults")
def get_additional_defaults(payload: AdditionalDefaultsRequest):
    """
    Computes and returns default values for all Additional Inputs fields
    based on the current basic inputs (span, carriageway width, footpath, etc.).
    """
    try:
        from osdagbridge.core.bridge_types.plate_girder.defaults import solve_extend_basic_input_dict

        # Prepare copy of basic inputs
        input_dict = dict(payload.basic_inputs)

        # Standardize numeric types if needed
        for k in ["geometry.span", "geometry.carriageway_width", "geometry.skew_angle"]:
            if k in input_dict and input_dict[k] is not None:
                try:
                    input_dict[k] = float(input_dict[k])
                except (ValueError, TypeError):
                    pass

        # Compute all extended defaults
        solve_extend_basic_input_dict(input_dict)

        # Sanitize any non-JSON serializable values if any
        sanitized = {}
        for k, v in input_dict.items():
            if isinstance(v, (str, int, float, bool, list, dict)) or v is None:
                sanitized[k] = v
            else:
                sanitized[k] = str(v)

        return {"status": "success", "defaults": sanitized}
    except Exception as e:
        print("ERROR COMPUTING ADDITIONAL DEFAULTS:", e)
        raise HTTPException(status_code=500, detail=str(e))

class RecomputeLayoutRequest(BaseModel):
    carriageway_width: float = 20.0
    crash_barrier_width: float = 0.45
    footpath_width: float = 0.0
    railing_width: float = 0.0
    median_width: float = 0.0
    n_footpaths: int = 0
    no_of_girders: Optional[int] = None
    girder_spacing: Optional[float] = None
    deck_overhang: Optional[float] = None
    changed_field: str = "girders"  # 'girders' | 'spacing' | 'overhang'

@router.post("/additional/recompute-layout")
def recompute_bridge_layout(req: RecomputeLayoutRequest):
    """
    Recomputes girder spacing, deck overhang, and overall bridge width
    when one of the layout inputs changes (using BridgeConfigurationSolver).
    """
    try:
        from osdagbridge.core.bridge_types.plate_girder.initial_sizing import BridgeConfigurationSolver

        solver = BridgeConfigurationSolver(
            carriageway_width=float(req.carriageway_width),
            crash_barrier_width=float(req.crash_barrier_width),
            footpath_width=float(req.footpath_width),
            railing_width=float(req.railing_width),
            median_width=float(req.median_width),
            n_footpaths=int(req.n_footpaths),
        )

        res = solver._solve_layout(
            no_of_girders=int(req.no_of_girders) if req.no_of_girders else 0,
            girder_spacing=float(req.girder_spacing) if req.girder_spacing else 0.0,
            deck_overhang=float(req.deck_overhang) if req.deck_overhang else 0.0,
            changed_field=req.changed_field,
        )

        return {
            "status": "success",
            "no_of_girders": res.no_of_girders,
            "girder_spacing": round(res.girder_spacing, 4),
            "deck_overhang": round(res.deck_overhang, 4),
            "overall_bridge_width": round(res.overall_width, 4),
        }
    except Exception as e:
        print("ERROR RECOMPUTING LAYOUT:", e)
        raise HTTPException(status_code=400, detail=str(e))
