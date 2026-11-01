"""Evaluate the Web dialog's Typical Section snapshot through Core.

Prepare defaults, validate editable inputs, resolve component properties, then
solve the bridge layout. Return only Typical Section values and UI control states;
the caller owns draft storage and Save. No Desktop/Qt callbacks are imported.
"""
from math import isfinite

from osdagbridge_core.utils import common as c
from osdagbridge_core.utils.codes import keyfile as k
from osdagbridge_core.utils.codes.irc5_2015 import IRC5_2015
from osdagbridge_core.bridge_types.plate_girder.defaults import (
    _update_typical_section_defaults, seed_no_of_girders,
)
from osdagbridge_core.bridge_types.plate_girder.initial_sizing import BridgeConfigurationSolver
from osdagbridge_core.bridge_types.plate_girder.ui_fields_additional_input import TYPICAL_SECTION_SCHEMA
from osdagbridge_core.bridge_types.plate_girder.validator import BridgeInputValidator
from osdagbridge_core.bridge_components.super_structure.crash_barrier import geometry as cbg, properties as cbp
from osdagbridge_core.bridge_components.super_structure.median import geometry as mdg, properties as mdp
from osdagbridge_core.bridge_components.super_structure.railing import geometry as rlg, properties as rlp
from osdagbridge_core.bridge_components.super_structure.deck.geometry import (
    WET_CONCRETE_DENSITY_kN_m3, BITUMINOUS_DENSITY_kN_m3,
)


# Derive the adapter's field scope from the same Core schema rendered by the UI.
FIELDS = {
    f['id']: f
    for panel in [TYPICAL_SECTION_SCHEMA.get('primary_fields', {}), *TYPICAL_SECTION_SCHEMA['tabs']]
    for row in panel.get('rows', []) for f in row['fields']
    if f.get('type') in (c.TYPE_TEXTBOX, c.TYPE_COMBOBOX)
}
OWNED = {*FIELDS, c.KEY_TS_NO_OF_FOOTPATHS}
LAYOUT = {c.KEY_TS_NO_OF_GIRDERS, c.KEY_TS_GIRDER_SPACING, c.KEY_TS_DECK_OVERHANG, c.KEY_TS_OVERALL_WIDTH}
DERIVED = {c.KEY_TS_DECK_OVERHANG, c.KEY_TS_OVERALL_WIDTH}


def controls(d):
    """Return disabled/hidden IDs using Desktop's Typical Section dependencies.

    These states also guard edited keys on the server, so a request cannot change
    a calculated field or a field disabled by the current Basic Inputs.
    """
    disabled, hidden = set(DERIVED), set()
    footpath = d[c.KEY_FOOTPATH] != 'None'
    for enabled, tab, keys in [
        (footpath, c.KEY_RL_TAB, [key for key in FIELDS if key.startswith('typical_section.railing.')]),
        (d[c.KEY_INCLUDE_MEDIAN] == 'Yes', c.KEY_MD_TAB, [key for key in FIELDS if key.startswith('typical_section.median.')]),
    ]:
        if not enabled:
            disabled.update([tab, *keys])
    if not footpath:
        disabled.update([c.KEY_TS_FOOTPATH_WIDTH, c.KEY_TS_FOOTPATH_THICKNESS])
    disabled.add(c.KEY_WC_LD_TAB)
    for type_key, density, width, height, area, load, posts in [
        (c.KEY_CB_TYPE, c.KEY_CB_DENSITY, c.KEY_CB_WIDTH, c.KEY_CB_HEIGHT, c.KEY_CB_AREA, c.KEY_CB_LOAD, c.KEY_CB_POST_SPACING),
        (c.KEY_MD_TYPE, c.KEY_MD_DENSITY, c.KEY_MD_WIDTH, c.KEY_MD_HEIGHT, c.KEY_MD_AREA, c.KEY_MD_LOAD, c.KEY_MD_POST_SPACING),
    ]:
        kind = str(d.get(type_key) or '')
        rcc = 'RCC' in kind or kind == 'IRC 5 - Raised Kerb'
        metallic = 'Metallic' in kind
        if not rcc:
            hidden.update([density, area])
        if not metallic:
            hidden.add(posts)
            disabled.add(posts)
        if kind != 'Custom':
            disabled.update([density, width, height, area, load])
    if d[c.KEY_RL_TYPE] != 'Custom':
        disabled.update([c.KEY_RL_WIDTH, c.KEY_RL_HEIGHT, c.KEY_RL_LOAD_MODE, c.KEY_RL_LOAD_VALUE])
    elif d[c.KEY_RL_LOAD_MODE] != 'Custom':
        disabled.add(c.KEY_RL_LOAD_VALUE)
    if d[c.KEY_WC_MATERIAL] != 'Custom':
        disabled.add(c.KEY_WC_DENSITY)
    return disabled, hidden


def barrier_values(d, median=False):
    """Select Core geometry/load helpers and convert mm/mm² to UI m/m²."""
    type_key, density, width, height, area, load, posts = (
        (c.KEY_MD_TYPE, c.KEY_MD_DENSITY, c.KEY_MD_WIDTH, c.KEY_MD_HEIGHT, c.KEY_MD_AREA, c.KEY_MD_LOAD, c.KEY_MD_POST_SPACING)
        if median else
        (c.KEY_CB_TYPE, c.KEY_CB_DENSITY, c.KEY_CB_WIDTH, c.KEY_CB_HEIGHT, c.KEY_CB_AREA, c.KEY_CB_LOAD, c.KEY_CB_POST_SPACING)
    )
    kind = d[type_key]
    if kind in ('Custom', None):
        return {}
    geom = IRC5_2015.cl_109_6_3_shapes
    if 'Metallic' in kind:
        double = 'Double' in kind
        variant = 'Double' if double else 'Single'
        shape = geom(
            k.KEY_MEDIAN_TYPE[2] if median else k.KEY_CRASH_BARRIER_TYPE[1],
            None if median else c.VALUES_FOOTPATH[0], None, {},
            k.KEY_METALLIC_CRASH_BARRIER_TYPE[int(double)],
        )
        dead_load = (mdp.median_metallic_barrier_load if median else cbp.metallic_edge_barrier_load)(
            variant, post_spacing=float(d[posts]) * 1000)['total_load_kN_per_m']
        return {
            width: shape['kerb_bottom_width' if median else width] / 1000,
            height: (shape['post_height'] + shape['kerb_height']) / 1000 if median else shape[height] / 1000,
            load: round(dead_load, 2),
        }
    if median:
        kerb = kind == 'IRC 5 - Raised Kerb'
        shape = geom(k.KEY_MEDIAN_TYPE[0 if kerb else 1], None, None, {}, None)
        cross_area = (mdg.median_raised_kerb_area if kerb else mdg.median_rcc_crash_barrier_area)()[
            'kerb_area' if kerb else 'total_area'
        ]
        dead_load = (mdp.median_raised_kerb_load if kerb else mdp.median_rcc_barrier_load)()['total_load_kN_per_m']
        w, h = shape['kerb_bottom_width' if kerb else width], shape['kerb_height' if kerb else 'barrier_height']
    else:
        high = kind == 'IRC 5 - High Containment RCC Crash Barrier'
        footpath = d[c.KEY_FOOTPATH] != 'None'
        steel = 'Steel' in d[c.KEY_RL_TYPE]
        railing = 'steel' if steel else 'rcc'
        shape = geom(
            k.KEY_CRASH_BARRIER_TYPE[2], d[c.KEY_FOOTPATH],
            k.KEY_RAILING_TYPE[int(steel)], {}, k.KEY_RIGID_CRASH_BARRIER_TYPE[int(high)],
        )
        # Match Desktop's precedence: high containment, then footpath/railing,
        # otherwise a rigid barrier without a footpath.
        cross_area = (
            cbg.high_containment_barrier_area() if high else
            cbg.rigid_barrier_with_railing_area(railing) if footpath else
            cbg.rigid_barrier_no_footpath_area()
        )['barrier_area']
        dead_load = (
            cbp.high_containment_barrier_load() if high else
            (cbp.steel_railing_load if steel else cbp.rcc_railing_load)() if footpath else
            cbp.rigid_barrier_no_footpath_load()
        )['total_load_kN_per_m']
        w, h = shape[width], shape[height]
    return {density: c.DEFAULT_CONCRETE_DENSITY, width: w / 1000, height: h / 1000,
            area: round(cross_area / 1e6, 4), load: round(dead_load, 2)}


def compute_components(d):
    """Update standard component properties in-place before solving the layout.

    Custom dimensions/loads stay user-controlled. An excluded median contributes
    zero width, and standard wearing-course density comes from Core.
    """
    d.update(barrier_values(d))
    if d[c.KEY_INCLUDE_MEDIAN] == 'Yes':
        d.update(barrier_values(d, median=True))
    else:
        d[c.KEY_MD_WIDTH] = 0.0
    if d[c.KEY_RL_TYPE] != 'Custom':
        steel = d[c.KEY_RL_TYPE] == 'IRC 5 - Steel Railing'
        shape = IRC5_2015.cl_109_6_3_shapes(
            k.KEY_CRASH_BARRIER_TYPE[2], k.KEY_FOOTPATH[1],
            k.KEY_RAILING_TYPE[int(steel)], {}, None,
        )
        for key, name in [(c.KEY_RL_WIDTH, 'railing_width'), (c.KEY_RL_HEIGHT, 'railing_height')]:
            if shape.get(name) is not None:
                d[key] = shape[name] / 1000
        d.update({c.KEY_RL_LOAD_MODE: 'As per IRC 6',
                  c.KEY_RL_LOAD_VALUE: (rlp.steel_railing_load if steel else rlp.rcc_railing_load)()['total_load_kN_per_m']})
    elif d[c.KEY_RL_LOAD_MODE] == 'As per IRC 6':
        d[c.KEY_RL_LOAD_VALUE] = round(rlp.load_from_area(rlg.rigid_barrier_with_railing_area('rcc')['barrier_area'], rlp.RCC_DENSITY), 3)
    if d[c.KEY_WC_MATERIAL] != 'Custom':
        d[c.KEY_WC_DENSITY] = WET_CONCRETE_DENSITY_kN_m3 if d[c.KEY_WC_MATERIAL] == 'Concrete' else BITUMINOUS_DENSITY_kN_m3


def evaluate(inputs, changed_key=None, validate_all=False):
    """Return values, issues, control states and notices for one input snapshot.

    Field edits supply changed_key; Save supplies validate_all to range-check all
    applicable fields. Core corrections are returned for user acknowledgment,
    without silently applying them or persisting the snapshot.
    """
    if changed_key is not None and changed_key not in FIELDS:
        raise ValueError('Unsupported Typical Section field.')
    validator = BridgeInputValidator()
    issues, notices = [], []
    d = {
        key: inputs.get(key)
        for key in (c.KEY_SPAN, c.KEY_CARRIAGEWAY_WIDTH, c.KEY_SKEW_ANGLE, c.KEY_FOOTPATH, c.KEY_INCLUDE_MEDIAN)
    }
    if c.KEY_SKEW_ANGLE not in inputs:
        d[c.KEY_SKEW_ANGLE] = 0
    # These are the Basic Input dropdown defaults, not substitutes for invalid values.
    for key, default in [(c.KEY_FOOTPATH, 'None'), (c.KEY_INCLUDE_MEDIAN, 'No')]:
        if d[key] is None:
            d[key] = default
    # Core currently exposes default preparation through this internal helper.
    # Seed first, then overlay saved values so reopening preserves user edits.
    _update_typical_section_defaults(d)
    default_footpath_width = d[c.KEY_TS_FOOTPATH_WIDTH]
    d.update({key: value for key, value in inputs.items() if key in OWNED and (value is not None or key == changed_key)})
    if changed_key is None and d[c.KEY_FOOTPATH] != 'None' and d.get(c.KEY_TS_FOOTPATH_WIDTH) == 0:
        # Re-enabling a footpath must replace its formerly disabled zero width.
        d[c.KEY_TS_FOOTPATH_WIDTH] = default_footpath_width
    disabled, hidden = controls(d)

    def issue(key, message, correction=None):
        issues.append({'key': key, 'message': message, 'corrected_value': correction})

    def response():
        # Only owned keys leave this adapter; unrelated Basic/Material Inputs
        # remain untouched when the frontend merges a successful Save.
        disabled_ids, hidden_ids = controls(d)
        return {
            'values': {
                key: str(value) if isinstance(value, float) and not isfinite(value) else value
                for key, value in d.items() if key in OWNED
            },
            'issues': issues,
            'disabled': sorted(disabled_ids),
            'hidden': sorted(hidden_ids),
            'notices': notices,
        }

    if changed_key in disabled | hidden:
        raise ValueError('This Typical Section field is not editable in the current configuration.')
    # Reject invalid basic geometry before invoking component/layout helpers.
    for key in (c.KEY_FOOTPATH, c.KEY_INCLUDE_MEDIAN):
        if d[key] not in (c.VALUES_FOOTPATH if key == c.KEY_FOOTPATH else ['No', 'Yes']):
            issue(key, 'Select a supported value.')
    for key in [c.KEY_SPAN, c.KEY_CARRIAGEWAY_WIDTH, c.KEY_SKEW_ANGLE]:
        value = d.get(key)
        try:
            if isinstance(value, bool) or not isfinite(float(value)):
                raise ValueError()
            d[key] = float(value)
        except (ValueError, TypeError, OverflowError):
            issue(key, 'Enter a finite number in Basic Inputs.')
            continue
        result = validator.validate_basic_inputs(key, d)
        if result:
            issue(key, result[1], result[0])
    # Parse every applicable value, but run Core range checks on the edited field
    # or the whole group on Save. Disabled standard properties are derived below.
    for key, field in FIELDS.items():
        if key in disabled | hidden:
            continue
        value = d.get(key)
        if key in LAYOUT and value is None and changed_key != key:
            continue  # Seed the initial layout after component widths have been resolved.
        if field['type'] == c.TYPE_COMBOBOX:
            if value not in field['choices']:
                issue(key, 'Select a supported value.')
            continue
        try:
            if isinstance(value, bool) or not isfinite(float(value)):
                raise ValueError()
            number = float(value)
            if key == c.KEY_TS_NO_OF_GIRDERS and not number.is_integer():
                raise ValueError()
            d[key] = int(number) if key == c.KEY_TS_NO_OF_GIRDERS else number
        except (ValueError, TypeError, OverflowError):
            # Keep raw text so the browser can correct it; never serialize NaN/Infinity.
            d[key] = str(value) if isinstance(value, float) and not isfinite(value) else value
            issue(key, 'Enter a whole number.' if key == c.KEY_TS_NO_OF_GIRDERS else 'Enter a finite number.')
            continue
        if validate_all or key == changed_key:
            result = validator.validate_additional_inputs(key, d)
            if result:
                issue(key, result[1], result[0])
    if issues:
        return response()
    try:
        # Barrier, railing and median widths feed the overall-width calculation.
        compute_components(d)
        footpaths = 0 if d[c.KEY_FOOTPATH] == 'None' else 2 if d[c.KEY_FOOTPATH] == 'Both Sides' else 1
        if not footpaths:
            d[c.KEY_TS_FOOTPATH_WIDTH] = 0.0
        solver = BridgeConfigurationSolver(
            d[c.KEY_CARRIAGEWAY_WIDTH], d[c.KEY_CB_WIDTH], d[c.KEY_TS_FOOTPATH_WIDTH],
            d[c.KEY_RL_WIDTH], d[c.KEY_MD_WIDTH], footpaths,
        )
        width = solver.calculate_overall_bridge_width()
        initial = d.get(c.KEY_TS_NO_OF_GIRDERS) is None
        count = seed_no_of_girders(width) if initial else d[c.KEY_TS_NO_OF_GIRDERS]
        changed = 'girders' if (
            initial or changed_key == c.KEY_TS_NO_OF_GIRDERS
            or (changed_key is None and inputs.get(c.KEY_TS_OVERALL_WIDTH) != width)
        ) else 'spacing'
        # Reuse Core's internal layout helper rather than duplicating its rules.
        # Count edits (or changed overall width on opening) control spacing;
        # other evaluations preserve the supplied spacing where it can fit.
        layout = solver._solve_layout(
            no_of_girders=count, girder_spacing=d.get(c.KEY_TS_GIRDER_SPACING, 0),
            deck_overhang=d.get(c.KEY_TS_DECK_OVERHANG, 0), changed_field=changed,
        )
        updates = {
            c.KEY_TS_NO_OF_GIRDERS: layout.no_of_girders,
            c.KEY_TS_GIRDER_SPACING: layout.girder_spacing,
            c.KEY_TS_DECK_OVERHANG: layout.deck_overhang,
            c.KEY_TS_OVERALL_WIDTH: layout.overall_width,
        }
        # Describe dependent adjustments; omit the field the user just changed.
        adjustments = []
        for key, label in [
            (c.KEY_TS_GIRDER_SPACING, 'spacing'),
            (c.KEY_TS_DECK_OVERHANG, 'overhang'),
            (c.KEY_TS_NO_OF_GIRDERS, 'girders'),
        ]:
            if changed_key and key != changed_key and inputs.get(key) is not None and abs(float(inputs[key]) - updates[key]) > 0.01:
                places = 0 if key == c.KEY_TS_NO_OF_GIRDERS else 2
                adjustments.append(f'{label} {float(inputs[key]):.{places}f} → {updates[key]:.{places}f}')
        if adjustments:
            notices.append('Values adjusted: ' + ', '.join(adjustments))
        if layout.deck_overhang > layout.girder_spacing:
            notices.append(f'Warning: overhang ({layout.deck_overhang:.2f} m) exceeds spacing ({layout.girder_spacing:.2f} m).')
        d.update(updates)
        d[c.KEY_TS_NO_OF_FOOTPATHS] = footpaths
    except (ValueError, TypeError, ZeroDivisionError, OverflowError) as exc:
        issue(changed_key if changed_key in LAYOUT else c.KEY_TS_GIRDER_SPACING, str(exc))
    return response()
