from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.services.supabase import supabase_client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

def get_user_trial_days_remaining(created_at) -> int:
    from datetime import datetime, timezone
    if isinstance(created_at, str):
        cleaned = created_at.replace("Z", "+00:00")
        created_dt = datetime.fromisoformat(cleaned)
    elif isinstance(created_at, datetime):
        created_dt = created_at
    else:
        return 30
    
    now = datetime.now(timezone.utc)
    if created_dt.tzinfo is None:
        created_dt = created_dt.replace(tzinfo=timezone.utc)
        
    diff = now - created_dt
    days_passed = max(0, diff.days)
    return max(0, 30 - days_passed)

router = APIRouter(prefix="/api/auth", tags=["auth"])

security = HTTPBearer()

class UserRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    trial_ended: bool
    trial_days_left: int

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    password: str

class ProfileUpdateRequest(BaseModel):
    first_name: str
    last_name: str

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
            "password": user_data.password,
            "options": {
                "data": {
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name
                }
            }
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
    user_metadata = user.user_metadata or {}
    days_left = get_user_trial_days_remaining(user.created_at)
    trial_ended = days_left <= 0
    return UserMe(
        id=user.id,
        email=user.email or "",
        email_confirmed=email_confirmed,
        first_name=user_metadata.get("first_name"),
        last_name=user_metadata.get("last_name"),
        trial_ended=trial_ended,
        trial_days_left=days_left
    )

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    try:
        supabase_client.auth.reset_password_for_email(
            payload.email,
            options={"redirect_to": "http://localhost:3000/reset-password"}
        )
        return {"status": "success", "message": "Password reset email sent. Please check your inbox."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to send password reset email: {str(e)}"
        )

@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        from supabase import create_client
        from app.config import settings
        
        # Create an independent request-scoped client to avoid session leaks
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        
        # Initialize session with the recovery access token
        client.auth.set_session(token, "")
        
        # Update user's password in Supabase Auth
        client.auth.update_user({"password": payload.password})
        
        return {"status": "success", "message": "Password updated successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to reset password: {str(e)}"
        )

@router.put("/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        from supabase import create_client
        from app.config import settings
        
        # Create an independent request-scoped client to avoid session leaks
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        
        # Initialize session with the access token
        client.auth.set_session(token, "")
        
        # Update user's metadata in Supabase Auth
        response = client.auth.update_user({
            "data": {
                "first_name": payload.first_name,
                "last_name": payload.last_name
            }
        })
        
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update profile info"
            )
            
        return {"status": "success", "message": "Profile updated successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.delete("/account")
async def delete_account(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        from supabase import create_client
        from app.config import settings
        
        # 1. Get the current user first to obtain their ID
        user_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        user_client.auth.set_session(token, "")
        user_resp = user_client.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        user_id = user_resp.user.id

        # 2. Wipe user's notes from public.notes table
        admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        admin_client.table("notes").delete().eq("user_id", user_id).execute()

        # 3. Delete the auth user record
        admin_client.auth.admin.delete_user(user_id)

        return {"status": "success", "message": "Account and all associated notes deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete account: {str(e)}"
        )
