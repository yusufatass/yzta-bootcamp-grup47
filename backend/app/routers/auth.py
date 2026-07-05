from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.services.supabase import supabase_client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/auth", tags=["auth"])

security = HTTPBearer()

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
    email_confirmed: bool

class UserMe(BaseModel):
    id: str
    email: str
    email_confirmed: bool

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Validate the token against Supabase Auth
        response = supabase_client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return response.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    try:
        # Sign up the user via Supabase Auth
        response = supabase_client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        user = response.user
        email_confirmed = user.email_confirmed_at is not None if user else False
        return {
            "message": "Registration successful. Please check your email to verify your account.",
            "email_confirmed": email_confirmed
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    try:
        # Authenticate user with password via Supabase Auth
        response = supabase_client.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        session = response.session
        user = response.user
        if not session or not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login credentials"
            )
            
        email_confirmed = user.email_confirmed_at is not None
        
        return TokenResponse(
            access_token=session.access_token,
            token_type="bearer",
            expires_in=session.expires_in,
            refresh_token=session.refresh_token,
            email_confirmed=email_confirmed
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=UserMe)
async def get_me(user = Depends(get_current_user)):
    email_confirmed = user.email_confirmed_at is not None
    return UserMe(
        id=user.id,
        email=user.email or "",
        email_confirmed=email_confirmed
    )
