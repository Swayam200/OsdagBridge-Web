"""Initialize and validate the Web Typical Section draft with Core."""
from copy import deepcopy
from math import isfinite
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from osdagbridge_core.utils import common as c
from osdagbridge_core.bridge_types.plate_girder.defaults import BASIC_INPUT_DICT, solve_extend_basic_input_dict
from osdagbridge_core.bridge_types.plate_girder.ui_fields import FrontendData
from osdagbridge_core.bridge_types.plate_girder.ui_fields_additional_input import ADDITIONAL_INPUTS_SCHEMA
from osdagbridge_core.bridge_types.plate_girder.validator import BridgeInputValidator

router = APIRouter(prefix="/additional-inputs", tags=["Additional Inputs"])


def _initialize_defaults(inputs):
    # Core's initializer overwrites and expands its argument: never pass the imported template.
    working = deepcopy(BASIC_INPUT_DICT)
    errors = {}
    basic_fields = FrontendData().input_values()
    labels = {field[0]: field[1] for field in basic_fields}
    working.update({key: inputs[key] for key in labels.keys() & inputs.keys() & working.keys()})
    for key, label, _, choices, _, _, meta in basic_fields:
        value = working.get(key)
        if meta.get("required") and value in (None, ""):
            errors[key] = f"{label} is required."
        elif key in inputs and key in working and choices and (value not in choices or value in meta.get("disabled_options", [])):
            errors[key] = f"Unsupported value for {label}."
    validator = BridgeInputValidator()
    for key in [c.KEY_SPAN, c.KEY_CARRIAGEWAY_WIDTH, c.KEY_SKEW_ANGLE]:
        if key == c.KEY_SKEW_ANGLE and working[key] in (None, ""):
            continue
        try:
            value = float(working[key])
            if not isfinite(value):
                raise ValueError()
            working[key] = value
            result = validator.validate_basic_inputs(key, working)
            if result is not None:
                errors[key] = result[1]
        except (TypeError, ValueError):
            errors.setdefault(key, f"{labels[key]}: enter a finite numeric value.")
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    try:
        solve_extend_basic_input_dict(working)
    except (ValueError, ArithmeticError) as error:
        raise HTTPException(status_code=422, detail=f"Could not initialize Typical Section: {error}") from error

    return working


class TypicalEdit(BaseModel):
    key: str
    value: str | int | float


class TypicalSectionRequest(BaseModel):
    inputs: dict[str, Any]
    edits: list[TypicalEdit] = Field(default_factory=list)


def _section_schema():
    return next(tab["schema"] for tab in ADDITIONAL_INPUTS_SCHEMA if tab["schema"]["id"] == c.KEY_TS_TAB)


def _fields():
    page = _section_schema()
    return {
        field["id"]: field
        for panel in [page["primary_fields"], *page["tabs"]]
        for row in panel.get("rows", [])
        for field in row["fields"]
        if field.get("type") in (c.TYPE_TEXTBOX, c.TYPE_COMBOBOX)
    }


def _field_states(d, fields):
    """Describe which controls are available for the selected component types."""
    states = {key: "readonly" if field.get("read_only") else "editable" for key, field in fields.items()}
    if d[c.KEY_FOOTPATH] == c.VALUES_FOOTPATH[0]:
        for key in (c.KEY_TS_FOOTPATH_WIDTH, c.KEY_TS_FOOTPATH_THICKNESS):
            states[key] = "readonly"
        for key in (c.KEY_RL_TYPE, c.KEY_RL_WIDTH, c.KEY_RL_HEIGHT, c.KEY_RL_LOAD_MODE, c.KEY_RL_LOAD_VALUE):
            states[key] = "hidden"
    if d[c.KEY_INCLUDE_MEDIAN] != c.VALUES_NO_YES[1]:
        for key in (c.KEY_MD_TYPE, c.KEY_MD_DENSITY, c.KEY_MD_WIDTH, c.KEY_MD_HEIGHT,
                    c.KEY_MD_AREA, c.KEY_MD_LOAD, c.KEY_MD_POST_SPACING):
            states[key] = "hidden"

    for type_key, density, area, width, height, load, spacing in (
        (c.KEY_CB_TYPE, c.KEY_CB_DENSITY, c.KEY_CB_AREA, c.KEY_CB_WIDTH,
         c.KEY_CB_HEIGHT, c.KEY_CB_LOAD, c.KEY_CB_POST_SPACING),
        (c.KEY_MD_TYPE, c.KEY_MD_DENSITY, c.KEY_MD_AREA, c.KEY_MD_WIDTH,
         c.KEY_MD_HEIGHT, c.KEY_MD_LOAD, c.KEY_MD_POST_SPACING),
    ):
        if states[type_key] == "hidden":
            continue
        selection = d[type_key]
        custom = selection == "Custom"
        metallic = "Metallic" in selection
        states[density] = states[area] = "hidden" if custom or metallic else "readonly"
        states[width] = states[height] = states[load] = "editable" if custom else "readonly"
        states[spacing] = "editable" if metallic else "hidden"

    if states[c.KEY_RL_TYPE] != "hidden":
        custom = d[c.KEY_RL_TYPE] == "Custom"
        for key in (c.KEY_RL_WIDTH, c.KEY_RL_HEIGHT, c.KEY_RL_LOAD_MODE):
            states[key] = "editable" if custom else "readonly"
        states[c.KEY_RL_LOAD_VALUE] = (
            "editable" if custom and d[c.KEY_RL_LOAD_MODE] == "Custom" else "readonly"
        )
    states[c.KEY_WC_DENSITY] = "editable" if d[c.KEY_WC_MATERIAL] == "Custom" else "readonly"
    return states


def _refresh_barrier(d):
    from osdagbridge_core.utils.codes.irc5_2015 import IRC5_2015
    from osdagbridge_core.utils.codes import keyfile as k
    from osdagbridge_core.bridge_components.super_structure.crash_barrier import geometry, properties

    selection = d[c.KEY_CB_TYPE]
    if selection == "Custom":
        return
    if "Metallic" in selection:
        double = "Double" in selection
        shape = IRC5_2015.cl_109_6_3_shapes(
            k.KEY_CRASH_BARRIER_TYPE[1], c.VALUES_FOOTPATH[0], None, {},
            k.KEY_METALLIC_CRASH_BARRIER_TYPE[int(double)],
        )
        load = properties.metallic_edge_barrier_load(
            "Double" if double else "Single", post_spacing=d[c.KEY_CB_POST_SPACING] * 1000,
        )
    else:
        footpath = d[c.KEY_FOOTPATH]
        has_footpath = footpath != c.VALUES_FOOTPATH[0]
        steel = d[c.KEY_RL_TYPE] == c.VALUES_RAILING_TYPE[1]
        high = selection == "IRC 5 - High Containment RCC Crash Barrier"
        railing = k.KEY_RAILING_TYPE[int(steel)] if has_footpath else None
        shape = IRC5_2015.cl_109_6_3_shapes(
            k.KEY_CRASH_BARRIER_TYPE[2], footpath, railing, {}, k.KEY_RIGID_CRASH_BARRIER_TYPE[int(high)],
        )
        if high:
            area = geometry.high_containment_barrier_area()
            load = properties.high_containment_barrier_load()
        elif has_footpath:
            area = geometry.rigid_barrier_with_railing_area("steel" if steel else "rcc")
            load = properties.steel_railing_load() if steel else properties.rcc_railing_load()
        else:
            area = geometry.rigid_barrier_no_footpath_area()
            load = properties.rigid_barrier_no_footpath_load()
        d.update({c.KEY_CB_DENSITY: c.DEFAULT_CONCRETE_DENSITY,
                  c.KEY_CB_AREA: round(area["barrier_area"] / 1e6, 4)})
    d.update({c.KEY_CB_WIDTH: round(shape[c.KEY_CB_WIDTH] / 1000, 3),
              c.KEY_CB_HEIGHT: round(shape[c.KEY_CB_HEIGHT] / 1000, 3),
              c.KEY_CB_LOAD: round(load["total_load_kN_per_m"], 2)})


def _refresh_median(d):
    from osdagbridge_core.utils.codes.irc5_2015 import IRC5_2015
    from osdagbridge_core.utils.codes import keyfile as k
    from osdagbridge_core.bridge_components.super_structure.median import geometry, properties

    if d[c.KEY_INCLUDE_MEDIAN] != c.VALUES_NO_YES[1] or d[c.KEY_MD_TYPE] == "Custom":
        return
    selection = d[c.KEY_MD_TYPE]
    if "Metallic" in selection:
        double = "Double" in selection
        shape = IRC5_2015.cl_109_6_3_shapes(
            k.KEY_MEDIAN_TYPE[2], None, None, {}, k.KEY_METALLIC_CRASH_BARRIER_TYPE[int(double)],
        )
        width, height = shape["kerb_bottom_width"], shape["post_height"] + shape["kerb_height"]
        load = properties.median_metallic_barrier_load(
            "Double" if double else "Single", post_spacing=d[c.KEY_MD_POST_SPACING] * 1000,
        )
    else:
        kerb = selection == "IRC 5 - Raised Kerb"
        shape = IRC5_2015.cl_109_6_3_shapes(k.KEY_MEDIAN_TYPE[0 if kerb else 1], None, None, {}, None)
        if kerb:
            width, height = shape["kerb_bottom_width"], shape["kerb_height"]
            area = geometry.median_raised_kerb_area()["kerb_area"]
            load = properties.median_raised_kerb_load()
        else:
            width, height = shape[c.KEY_MD_WIDTH], shape["barrier_height"]
            area = geometry.median_rcc_crash_barrier_area()["total_area"]
            load = properties.median_rcc_barrier_load()
        d.update({c.KEY_MD_DENSITY: c.DEFAULT_CONCRETE_DENSITY, c.KEY_MD_AREA: round(area / 1e6, 4)})
    d.update({c.KEY_MD_WIDTH: round(width / 1000, 3), c.KEY_MD_HEIGHT: round(height / 1000, 3),
              c.KEY_MD_LOAD: round(load["total_load_kN_per_m"], 2)})


def _refresh_railing(d):
    from osdagbridge_core.utils.codes.irc5_2015 import IRC5_2015
    from osdagbridge_core.utils.codes import keyfile as k
    from osdagbridge_core.bridge_components.super_structure.railing import geometry, properties

    selection = d[c.KEY_RL_TYPE]
    if selection == "Custom":
        if d[c.KEY_RL_LOAD_MODE] == "As per IRC 6":
            area = geometry.rigid_barrier_with_railing_area("rcc")["barrier_area"]
            d[c.KEY_RL_LOAD_VALUE] = round(properties.load_from_area(area, properties.RCC_DENSITY), 3)
        return
    steel = selection == c.VALUES_RAILING_TYPE[1]
    shape = IRC5_2015.cl_109_6_3_shapes(
        k.KEY_CRASH_BARRIER_TYPE[2], c.VALUES_FOOTPATH[1], k.KEY_RAILING_TYPE[int(steel)], {}, None,
    )
    load = properties.steel_railing_load() if steel else properties.rcc_railing_load()
    d.update({c.KEY_RL_LOAD_MODE: "As per IRC 6", c.KEY_RL_LOAD_VALUE: round(load["total_load_kN_per_m"], 3)})
    for key, name in [(c.KEY_RL_WIDTH, "railing_width"), (c.KEY_RL_HEIGHT, "railing_height")]:
        if shape.get(name) is not None:
            d[key] = round(shape[name] / 1000, 3)


def _refresh_wearing_course(d):
    from osdagbridge_core.bridge_components.super_structure.deck.geometry import (
        BITUMINOUS_DENSITY_kN_m3, WET_CONCRETE_DENSITY_kN_m3,
    )

    density = {"Concrete": WET_CONCRETE_DENSITY_kN_m3, "Bituminous": BITUMINOUS_DENSITY_kN_m3}
    if d[c.KEY_WC_MATERIAL] in density:
        d[c.KEY_WC_DENSITY] = density[d[c.KEY_WC_MATERIAL]]


def _solve_layout(d, changed_field="spacing"):
    from osdagbridge_core.bridge_types.plate_girder.initial_sizing import BridgeConfigurationSolver

    solver = BridgeConfigurationSolver(
        carriageway_width=d[c.KEY_CARRIAGEWAY_WIDTH], crash_barrier_width=d[c.KEY_CB_WIDTH],
        footpath_width=d[c.KEY_TS_FOOTPATH_WIDTH], railing_width=d[c.KEY_RL_WIDTH],
        median_width=d[c.KEY_MD_WIDTH], n_footpaths=d[c.KEY_TS_NO_OF_FOOTPATHS],
    )
    layout = solver._solve_layout(
        no_of_girders=d[c.KEY_TS_NO_OF_GIRDERS], girder_spacing=d[c.KEY_TS_GIRDER_SPACING],
        changed_field=changed_field,
    )
    d.update({
        c.KEY_TS_NO_OF_GIRDERS: layout.no_of_girders, c.KEY_TS_GIRDER_SPACING: layout.girder_spacing,
        c.KEY_TS_DECK_OVERHANG: layout.deck_overhang, c.KEY_TS_OVERALL_WIDTH: layout.overall_width,
    })


def _apply_edit(d, edit, fields, validator):
    key = edit.key
    if _field_states(d, fields).get(key) != "editable":
        raise ValueError("This field is not editable for the current section.")
    field = fields[key]
    value = edit.value
    if field.get("choices"):
        if value not in field["choices"]:
            raise ValueError("Select an available option.")
    else:
        value = float(value)
        if not isfinite(value) or value < 0:
            raise ValueError("Enter a finite, non-negative number.")
        if key == c.KEY_TS_NO_OF_GIRDERS:
            if not value.is_integer():
                raise ValueError("Enter a whole number of girders.")
            value = int(value)

    d[key] = value
    if not field.get("choices"):
        result = validator.validate_additional_inputs(key, d)
        if result:
            raise ValueError(result[1])

    if key in (c.KEY_CB_TYPE, c.KEY_CB_POST_SPACING, c.KEY_RL_TYPE):
        _refresh_barrier(d)
    if key in (c.KEY_MD_TYPE, c.KEY_MD_POST_SPACING):
        _refresh_median(d)
    if key in (c.KEY_RL_TYPE, c.KEY_RL_LOAD_MODE):
        _refresh_railing(d)
    if key == c.KEY_WC_MATERIAL:
        _refresh_wearing_course(d)
    if key == c.KEY_TS_NO_OF_GIRDERS:
        _solve_layout(d, "girders")
    elif key in (c.KEY_TS_GIRDER_SPACING, c.KEY_TS_FOOTPATH_WIDTH, c.KEY_CB_WIDTH, c.KEY_CB_TYPE,
                 c.KEY_MD_WIDTH, c.KEY_MD_TYPE, c.KEY_RL_WIDTH, c.KEY_RL_TYPE):
        _solve_layout(d)


@router.post("/typical-section")
def evaluate_typical_section(payload: TypicalSectionRequest):
    working = _initialize_defaults(payload.inputs)
    fields = _fields()
    try:
        _refresh_barrier(working)
        _refresh_median(working)
        _refresh_railing(working)
        _refresh_wearing_course(working)
        _solve_layout(working)
    except (ValueError, ArithmeticError) as error:
        raise HTTPException(status_code=422, detail=f"Could not initialize Typical Section: {error}") from error

    # Apply edits on the server's defaults so derived fields cannot be overridden by the client.
    validator = BridgeInputValidator()
    for edit in payload.edits:
        try:
            _apply_edit(working, edit, fields, validator)
        except (ValueError, ArithmeticError) as error:
            label = fields.get(edit.key, {}).get("label", edit.key).rstrip(":")
            raise HTTPException(status_code=422, detail=f"{label}: {error}") from error

    values = {key: working.get(key) for key in fields}
    for key, field in fields.items():
        if values[key] is None and field.get("choices"):
            values[key] = field["choices"][0]
    precision = {key: 2 for key in values}
    for places, keys in [
        (0, [c.KEY_TS_NO_OF_GIRDERS, c.KEY_CB_POST_SPACING, c.KEY_MD_POST_SPACING]),
        (1, [c.KEY_CB_DENSITY, c.KEY_MD_DENSITY, c.KEY_WC_DENSITY]),
        (3, [c.KEY_CB_WIDTH, c.KEY_CB_HEIGHT, c.KEY_MD_WIDTH, c.KEY_MD_HEIGHT, c.KEY_RL_WIDTH, c.KEY_RL_LOAD_VALUE]),
        (4, [c.KEY_CB_AREA, c.KEY_MD_AREA]),
    ]:
        precision.update(dict.fromkeys(keys, places))
    return {"values": values, "precision": precision, "states": _field_states(working, fields)}
