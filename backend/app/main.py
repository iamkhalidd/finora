from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base_class import Base
from app.db.session import engine

app = FastAPI(
    title="Finora API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Access-Token"]
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup():
    # Automatically create tables in development environment for smooth setup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Finora API server!"}
