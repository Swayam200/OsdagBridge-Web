from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compress large responses (India boundary GeoJSON: 6.6 MB -> 1.9 MB). Level 5 compresses
# in ~0.3 s; the default level 9 takes ~2.5 s per request for <1% smaller output.
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=5)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
