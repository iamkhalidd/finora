from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, users, transactions, budgets, trades, dashboard, forex, news, alerts

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(trades.router, prefix="/trades", tags=["trades"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(forex.router, prefix="/forex", tags=["forex"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
