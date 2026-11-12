"""Standard material information assembled from existing Core data and helpers."""
import sqlite3
from pathlib import Path
from contextlib import closing
from functools import lru_cache
from hashlib import sha256
import json

from fastapi import APIRouter, HTTPException, Request, Response
from osdagbridge_core import RESOURCE_DIR
from osdagbridge_core.utils import common as c
from osdagbridge_core.utils.codes.irc6_2017 import IRC6_2017

router = APIRouter(prefix="/materials", tags=["Materials"])

def _locate_resource_file(file_name: str) -> Path:
    # Resolve the installed Core package, including editable installs.
    return RESOURCE_DIR / file_name

def _execute_resource_query(query: str):
    db_path = _locate_resource_file("Intg_osdag.sqlite")
    # Read-only mode also prevents SQLite from creating a missing database.
    db_uri = db_path.as_uri() + "?mode=ro"
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
    if rows is not None:
        for grade, fck, fctm, ecm in rows:
            key = str(grade).strip().upper()
            values[key] = {
                "fck": float(fck),
                "fctm": float(fctm),
                "Ecm": float(ecm),
            }
    return values

def _load_steel_material_values_from_db():
    # Lazy import keeps the existing grade-list routes independent of analysis dependencies.
    from ospgrillage.material import create_material

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
        material = create_material(material="steel", E=float(e), v=float(poisson))
        values[key] = {
            "Fy": float(fy), "Fu": float(fu), "E": float(e), "Poisson": float(poisson),
            "G": round(material.shear_modulus, 1),
        }
    return values


def _material_fields(template, properties):
    return [{
        "id": getattr(c, f"KEY_MATERIAL_{template}_{name}"),
        "label": getattr(c, f"DISP_MATERIAL_{template}_{name}"),
        "type": "textbox", "label_html": True,
        "precision": 2 if name == "POISSON" else 1, "column": column,
    } for name, column in properties]


@lru_cache(maxsize=1)
def _catalogue_payload(database_signature):
    # The signature invalidates changed DB data; updating Core Python code requires a server restart.
    steel = _load_steel_material_values_from_db()
    concrete = _load_concrete_grade_values_from_db()
    densities = IRC6_2017.cl_203_dead_load()
    thermal = IRC6_2017.cl_215_4_material_properties()["alpha"] * 1e6
    for grades, density in [(steel, densities["steel"]), (concrete, densities["concrete_cement_reinforced"])]:
        for values in grades.values():
            # Match Desktop's t/m³ -> kN/m³ conversion and displayed precision.
            values.update(density=round(density * 9.8, 1), thermal=round(thermal, 1))
    catalogue = {"steel": steel, "concrete": concrete, "fields": {
        "steel": _material_fields("GIRDER", [
            ("DENSITY", "density"), ("FY", "Fy"), ("FU", "Fu"), ("E", "E"),
            ("G", "G"), ("POISSON", "Poisson"), ("THERMAL", "thermal"),
        ]),
        "concrete": _material_fields("DECK", [
            ("DENSITY", "density"), ("FCK", "fck"), ("FCTM", "fctm"), ("ECM", "Ecm"), ("THERMAL", "thermal"),
        ]),
    }}
    body = json.dumps(catalogue, separators=(",", ":"), sort_keys=True).encode()
    return body, '"' + sha256(body).hexdigest() + '"'


@router.get("/base-values")
def get_material_base_values(request: Request):
    try:
        database = _locate_resource_file("Intg_osdag.sqlite")
        stat = database.stat()
        body, etag = _catalogue_payload((str(database), stat.st_mtime_ns, stat.st_size))
    except (OSError, ImportError) as error:
        raise HTTPException(status_code=503, detail="Core material catalogue dependencies are unavailable.") from error
    headers = {"ETag": etag, "Cache-Control": "no-cache"}
    tags = request.headers.get("if-none-match", "").split(",")
    if any(tag.strip().removeprefix("W/") in (etag, "*") for tag in tags):
        return Response(status_code=304, headers=headers)
    return Response(content=body, media_type="application/json", headers=headers)
