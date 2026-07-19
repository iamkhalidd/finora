from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register(
    user_in: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )

    # Create new user
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True
    )
    db.add(db_user)
    await db.flush()
    await db.refresh(db_user)

    # Generate tokens
    access_token = create_access_token(db_user.id)
    refresh_token = create_refresh_token(db_user.id)

    # Set cookies
    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        max_age=3600 * 24, # 1 day
        samesite="lax",
        secure=False # set to True in prod
    )
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        max_age=3600 * 24 * 30, # 30 days
        samesite="lax",
        secure=False
    )

    # Include headers for axios/localStorage as backup
    response.headers["X-Access-Token"] = access_token

    return db_user

@router.post("/login")
async def login(
    credentials: UserCreate,  # reusing name, email, password for ease of controlled form submission
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        max_age=3600 * 24,
        samesite="lax",
        secure=False
    )
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        max_age=3600 * 24 * 30,
        samesite="lax",
        secure=False
    )

    response.headers["X-Access-Token"] = access_token

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="accessToken")
    response.delete_cookie(key="refreshToken")
    return {"detail": "Successfully logged out"}

@router.post("/refresh")
async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refreshToken")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    access_token = create_access_token(user_id)

    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        max_age=3600 * 24,
        samesite="lax",
        secure=False
    )

    response.headers["X-Access-Token"] = access_token

    return {"access_token": access_token, "token_type": "bearer"}
