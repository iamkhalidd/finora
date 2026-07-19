import pytest
import httpx
from backend.app.main import app

# Mocking endpoint connectivity test using FastAPI app directly
@pytest.mark.asyncio
async def test_read_root():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Welcome to the Finora API server!"}
