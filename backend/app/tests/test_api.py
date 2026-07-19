import pytest
import httpx

# Mocking endpoint connectivity test
@pytest.mark.asyncio
async def test_read_root():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        response = await client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Welcome to the Finora API server!"}
