from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, LoginRequest, AuthResponse
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token

router = APIRouter()


def _set_cookie(response: Response, key: str, value: str, max_age: int) -> None:
    response.set_cookie(
        key=key,
        value=value,
        httponly=True,
        max_age=max_age,
        samesite="none" if settings.COOKIE_SECURE else "lax",
        secure=settings.COOKIE_SECURE,
    )


def _issue_tokens(response: Response, user: User) -> AuthResponse:
    access_token = create_access_token(user.id)
    _set_cookie(response, "accessToken", access_token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    _set_cookie(response, "refreshToken", create_refresh_token(user.id), settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    return AuthResponse(access_token=access_token, user=user)


@router.post("/register", response_model=AuthResponse)
async def register(user_in: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(func.lower(User.email) == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        name=user_in.name.strip(),
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        is_active=True
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return _issue_tokens(response, user)


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(func.lower(User.email) == credentials.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    return _issue_tokens(response, user)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="accessToken")
    response.delete_cookie(key="refreshToken")
    return {"detail": "Successfully logged out"}


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    payload = decode_token(request.cookies.get("refreshToken") or "")
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    access_token = create_access_token(payload.get("sub"))
    _set_cookie(response, "accessToken", access_token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    return {"access_token": access_token, "token_type": "bearer"}
