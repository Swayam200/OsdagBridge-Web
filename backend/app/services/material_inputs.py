"""Material properties and custom-draft evaluation for the Web dialogs.

Read standard properties from Core's resource database, assemble Desktop's field
labels/defaults, and validate custom values through Core. Requests are stateless;
the browser owns the session's custom-material registry and Add/Cancel lifecycle.
"""
from math import isfinite
from contextlib import closing
import sqlite3

from osdagbridge_core import RESOURCE_DIR
from osdagbridge_core.utils import common as c
from osdagbridge_core.utils.codes.irc6_2017 import IRC6_2017
from osdagbridge_core.bridge_types.plate_girder.validator import BridgeInputValidator

MEMBERS = (c.KEY_GIRDER, c.KEY_CROSS_BRACING, c.KEY_END_DIAPHRAGM, c.KEY_DECK_CONCRETE_GRADE_BASIC)
STEEL = ('DENSITY', 'FY', 'FU', 'E', 'G', 'POISSON', 'THERMAL')
CONCRETE = ('DENSITY', 'FCK', 'FCTM', 'ECM', 'THERMAL')


def fields(member):
    """Build Core property definitions under the selected member's key prefix."""
    if member not in MEMBERS:
        raise ValueError('Unsupported material member.')
    template = 'DECK' if member == c.KEY_DECK_CONCRETE_GRADE_BASIC else 'GIRDER'
    return [
        {
            'id': getattr(c, f'KEY_MATERIAL_{template}_{name}').replace(c.KEY_GIRDER, member, 1),
            'label': getattr(c, f'DISP_MATERIAL_{template}_{name}'),
            'label_html': True,
            'type': 'textbox',
            'precision': 2 if name == 'POISSON' else 1,
        }
        for name in (CONCRETE if template == 'DECK' else STEEL)
    ]


def material_name(member, values):
    """Generate Desktop-style custom names from normalized strength values."""
    concrete = member == c.KEY_DECK_CONCRETE_GRADE_BASIC
    tokens = []
    for suffix in ('fck', 'fctm') if concrete else ('fy', 'fu'):
        value = values.get(f'{member}.{suffix}')
        try:
            number = float(value)
            tokens.append(f'{number:g}' if isfinite(number) else '')
        except (ValueError, TypeError):
            tokens.append('')
    return ('custom_concrete_' if concrete else 'custom_steel_') + '_'.join(token for token in tokens if token)


def properties(member, grade):
    """Load a standard grade, or seed Custom from Desktop's E250A/M15 defaults."""
    definitions = fields(member)
    concrete = member == c.KEY_DECK_CONCRETE_GRADE_BASIC
    custom = grade == 'Custom'
    selected = ('M15' if concrete else 'E 250A') if custom else grade
    # Parameterized lookup; the adapter never creates or modifies Core's databases.
    with closing(sqlite3.connect((RESOURCE_DIR / 'Intg_osdag.sqlite').as_uri() + '?mode=ro', uri=True)) as db:
        if concrete:
            row = db.execute(
                'SELECT fck, fctm, Ecm FROM Concrete_Grade_Properties WHERE REPLACE(UPPER(Grade), " ", "") = ?',
                (selected.replace(' ', '').upper(),),
            ).fetchone()
        else:
            row = db.execute(
                'SELECT [Yield Strength], [Ultimate Tensile Strength], [Modulus of Elasticity], [Poisson\'s Ratio] '
                'FROM Steel_Grade_Properties WHERE REPLACE(UPPER(Grade), " ", "") = ?',
                (selected.replace(' ', '').upper(),),
            ).fetchone()
    if row is None:
        raise ValueError('Material grade was not found in Core.')
    dead_load = IRC6_2017.cl_203_dead_load()
    # Match Desktop's t/m³ → kN/m³ conversion and displayed precision.
    if concrete:
        values = dict(zip(('fck', 'fctm', 'ecm'), map(float, row)))
        values['ecm'] = round(values['ecm'], 1)
        values['density'] = round(dead_load['concrete_cement_reinforced'] * 9.8, 1)
    else:
        values = dict(zip(('fy', 'fu', 'e', 'poisson'), map(float, row)))
        values['g'] = round(values['e'] / (2 * (1 + values['poisson'])), 1)
        values['density'] = round(dead_load['steel'] * 9.8, 1)
    # Desktop's default; Core's grade tables do not contain thermal expansion.
    values['thermal'] = 11.7
    values = {f'{member}.{key}': value for key, value in values.items()}
    return {
        'member': member,
        'material': material_name(member, values) if custom else grade,
        'fields': definitions,
        'values': values,
    }


def evaluate(member, values, changed_key=None, validate_all=False):
    """Validate a member-scoped draft and apply Desktop's steel E/G/ν linkage.

    Return issues with Core's suggested corrections for the dialog to acknowledge.
    A final full check also catches invalid properties produced by linked edits.
    """
    definitions = fields(member)
    allowed = {field['id'] for field in definitions}
    if changed_key is not None and changed_key not in allowed:
        raise ValueError('Unsupported material property.')
    if set(values) - allowed - {member}:
        raise ValueError('Material values must belong to the selected member.')
    parsed, issues = {}, []
    for field in definitions:
        key = field['id']
        value = values.get(key)
        try:
            if isinstance(value, bool) or not isfinite(float(value)):
                raise ValueError()
            parsed[key] = float(value)
        except (ValueError, TypeError, OverflowError):
            parsed[key] = str(value) if isinstance(value, float) and not isfinite(value) else value
            issues.append({'key': key, 'message': 'Please enter a valid finite number.', 'corrected_value': None})
    validator = BridgeInputValidator()

    def validate(keys):
        for key in keys:
            if any(issue['key'] == key for issue in issues):
                continue
            # Core validates steel through Girder template keys. Keep the issue
            # and output values under the actual selected member's prefix.
            template = (
                key if member == c.KEY_DECK_CONCRETE_GRADE_BASIC
                else key.replace(member, c.KEY_GIRDER, 1)
            )
            result = validator.validate_material_inputs(template, {template: parsed[key]})
            if result:
                issues.append({'key': key, 'message': result[1], 'corrected_value': result[0]})

    validate([changed_key] if changed_key else allowed)
    if not issues and member != c.KEY_DECK_CONCRETE_GRADE_BASIC and changed_key:
        e, g, nu = (f'{member}.{suffix}' for suffix in ('e', 'g', 'poisson'))
        if changed_key == g:
            parsed[e] = round(2 * parsed[g] * (1 + parsed[nu]), 1)
        elif changed_key in (e, nu):
            parsed[g] = round(parsed[e] / (2 * (1 + parsed[nu])), 1)
    if not issues and (validate_all or changed_key):
        validate(allowed)
    return {'material': material_name(member, parsed), 'values': parsed, 'issues': issues}
