"""Stored material catalogue values from Core; no derived-property calculations."""
from contextlib import closing
import sqlite3

from fastapi import APIRouter, HTTPException
from osdagbridge_core import RESOURCE_DIR

router = APIRouter(prefix="/materials", tags=["Materials"])

def _execute_resource_query(query: str):
    # Resolve the installed Core package, including editable installs; never create a database.
    db_uri = (RESOURCE_DIR / "Intg_osdag.sqlite").as_uri() + "?mode=ro"
    try:
        with closing(sqlite3.connect(db_uri, uri=True)) as connection:
            return connection.execute(query).fetchall()
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="Core material catalogue is unavailable.") from error

def _normalize_steel_material_name(name: str) -> str:
    return "".join(str(name or "").upper().split())

def _load_concrete_grade_values_from_db():
    rows = _execute_resource_query(
        """
        SELECT Grade, fck, fctm, Ecm
        FROM Concrete_Grade_Properties
        """
    )
    values = {}
    for grade, fck, fctm, ecm in rows:
        key = str(grade).strip().upper()
        values[key] = {
            "fck": float(fck),
            "fctm": float(fctm),
            "Ecm": float(ecm),
        }
    return values

def _load_steel_material_values_from_db():
    values = {}
    rows = _execute_resource_query(
        '''
        SELECT Grade, [Yield Strength], [Ultimate Tensile Strength],
               [Modulus of Elasticity], [Poisson's Ratio]
        FROM Steel_Grade_Properties
        '''
    )
    for material_name, fy, fu, e, poisson in rows:
        key = _normalize_steel_material_name(material_name)
        values[key] = {"Fy": float(fy), "Fu": float(fu), "E": float(e), "Poisson": float(poisson)}
    return values

@router.get("/base-values")
def get_material_base_values():
    return {
        "steel": _load_steel_material_values_from_db(),
        "concrete": _load_concrete_grade_values_from_db()
    }
