from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List
from app.services.supabase import get_user_client
from app.services.ai import analyze_note_content
from app.routers.auth import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/notes", tags=["notes"])

class NoteCreate(BaseModel):
    raw_text: str

class NoteMigrateItem(BaseModel):
    raw_text: str
    created_at: str

class NotesMigrateRequest(BaseModel):
    notes: List[NoteMigrateItem]

class UserContext:
    def __init__(self, user, client):
        self.user = user
        self.client = client

async def get_user_context(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user = Depends(get_current_user)
) -> UserContext:
    client = get_user_client(credentials.credentials)
    return UserContext(user, client)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    ctx: UserContext = Depends(get_user_context)
):
    raw_text = note_data.raw_text
    
    # 1. Reject empty or notes under 10 characters
    if not raw_text or len(raw_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note must be at least 10 characters long."
        )
    
    # 2. Truncate notes longer than 4000 characters before sending to AI
    ai_text = raw_text
    if len(raw_text) > 4000:
        ai_text = raw_text[:4000]
    
    try:
        # Call AI service with the (possibly truncated) text
        ai_result = analyze_note_content(ai_text)
        
        payload = {
            "user_id": ctx.user.id,
            "raw_text": raw_text,  # Keep the original raw text intact
            "category": ai_result["category"],
            "structured_content": ai_result["structured_content"]
        }
        res = ctx.client.table("notes").insert(payload).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save note"
            )
        return res.data[0]
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create note: {str(e)}"
        )



@router.get("")
async def list_notes(
    ctx: UserContext = Depends(get_user_context)
):
    try:
        res = ctx.client.table("notes").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list notes: {str(e)}"
        )

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    ctx: UserContext = Depends(get_user_context)
):
    try:
        res = ctx.client.table("notes").delete().eq("id", note_id).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        return {"status": "success", "message": "Note deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete note: {str(e)}"
        )

@router.post("/migrate")
async def migrate_notes(
    payload: NotesMigrateRequest,
    ctx: UserContext = Depends(get_user_context)
):
    if not payload.notes:
        return {"status": "success", "message": "No notes to migrate", "count": 0}
        
    try:
        db_notes = []
        for item in payload.notes:
            if not item.raw_text.strip():
                continue
            
            # Analyze each note using OpenAI
            ai_result = analyze_note_content(item.raw_text)
            
            db_notes.append({
                "user_id": ctx.user.id,
                "raw_text": item.raw_text,
                "category": ai_result["category"],
                "structured_content": ai_result["structured_content"],
                "created_at": item.created_at
            })
        
        if not db_notes:
            return {"status": "success", "message": "No valid notes to migrate", "count": 0}
            
        res = ctx.client.table("notes").insert(db_notes).execute()
        return {
            "status": "success",
            "message": f"Successfully migrated {len(db_notes)} notes",
            "count": len(db_notes)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Migration failed: {str(e)}"
        )
