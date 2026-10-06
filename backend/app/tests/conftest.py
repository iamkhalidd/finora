import os
import tempfile

# Must be set before the app (and its engine) is imported.
_db_file = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_db_file}"

import httpx
import pytest
from app.main import app
from app.db.base_class import Base
from app.db.session import engine


@pytest.fixture(autouse=True)
async def reset_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_client(client):
    res = await client.post(
        "/api/v1/auth/register",
        json={"name": "Ada", "email": "Ada@Example.com", "password": "secret123"},
    )
    assert res.status_code == 200, res.text
    client.headers["Authorization"] = f"Bearer {res.json()['access_token']}"
    return client
