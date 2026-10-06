from pydantic import BaseModel, EmailStr, Field, field_validator


def _normalize_email(v: str) -> str:
    return v.strip().lower()


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr

    _email = field_validator("email", mode="before")(_normalize_email)


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    _email = field_validator("email", mode="before")(_normalize_email)


class UserUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
