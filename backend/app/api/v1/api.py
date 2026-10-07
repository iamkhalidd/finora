from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, transactions, budgets, trades, imports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(trades.router, prefix="/trades", tags=["trades"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(imports.inbound_router, prefix="/inbound", tags=["inbound"])
