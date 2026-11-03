"""Read-only material information from Core's grade database.

Expose only stored properties in their existing units. Custom materials and
derived properties are deferred until Core provides a shared evaluation API.
"""
from contextlib import closing
import sqlite3

from fastapi import APIRouter, HTTPException
from osdagbridge_core import RESOURCE_DIR
from osdagbridge_core.utils import common as c

router = APIRouter(prefix='/materials', tags=['Materials'])


@router.get('/properties')
def get_properties(member: str, grade: str):
    """Return Core labels and stored grade properties without calculating values."""
    if member not in (c.KEY_GIRDER, c.KEY_CROSS_BRACING, c.KEY_END_DIAPHRAGM, c.KEY_DECK_CONCRETE_GRADE_BASIC):
        raise HTTPException(status_code=422, detail='Unsupported material member.')
    concrete = member == c.KEY_DECK_CONCRETE_GRADE_BASIC
    template = 'DECK' if concrete else 'GIRDER'
    names = ('FCK', 'FCTM', 'ECM') if concrete else ('FY', 'FU', 'E', 'POISSON')
    fields = [{
        'id': getattr(c, f'KEY_MATERIAL_{template}_{name}').replace(c.KEY_GIRDER, member, 1),
        'label': getattr(c, f'DISP_MATERIAL_{template}_{name}'),
        'label_html': True, 'type': 'textbox',
        'precision': 2 if name == 'POISSON' else 1,
    } for name in names]
    # Fixed queries and bound grade parameters; Core resources are opened read-only.
    query = (
        'SELECT fck, fctm, Ecm FROM Concrete_Grade_Properties '
        if concrete else
        "SELECT [Yield Strength], [Ultimate Tensile Strength], [Modulus of Elasticity], [Poisson's Ratio] FROM Steel_Grade_Properties "
    ) + 'WHERE REPLACE(UPPER(Grade), " ", "") = ?'
    with closing(sqlite3.connect((RESOURCE_DIR / 'Intg_osdag.sqlite').as_uri() + '?mode=ro', uri=True)) as db:
        row = db.execute(query, (grade.replace(' ', '').upper(),)).fetchone()
    if row is None:
        raise HTTPException(status_code=422, detail='Material grade was not found in Core.')
    return {
        'member': member, 'material': grade, 'fields': fields,
        'values': {field['id']: value for field, value in zip(fields, row)},
    }
