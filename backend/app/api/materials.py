# Reuse the existing catalogue router so base-values and grade lists share one mount.
from app.api.routes.materials import router

@router.get("/steel")
def get_steel_options():
    try:
        from osdagbridge_core.bridge_types.plate_girder.defaults import steel_properties

        return steel_properties #return all the steel_properties data from the database via the default.py file
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise

@router.get("/concrete")
def get_concrete_options():
    try:
        from osdagbridge_core.bridge_types.plate_girder.defaults import concrete_properties

        return concrete_properties
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise
