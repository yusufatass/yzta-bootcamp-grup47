from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from app.services.supabase import get_user_client
from app.services.ai import analyze_note_content
from app.routers.auth import get_current_user, security, get_user_trial_days_remaining
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/notes", tags=["notes"])

class NoteCreate(BaseModel):
    raw_text: str
    skip_ai: bool = False
    prompt_type: Optional[str] = None
    custom_prompt: Optional[str] = None

class NoteUpdate(BaseModel):
    raw_text: str
    skip_ai: bool = False
    category: Optional[str] = None
    structured_content: Optional[dict] = None
    prompt_type: Optional[str] = None
    custom_prompt: Optional[str] = None

class NoteRenameTitle(BaseModel):
    title: str

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
    skip_ai = note_data.skip_ai
    
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
    
    # Check trial
    trial_days_left = get_user_trial_days_remaining(ctx.user.created_at)
    trial_ended = trial_days_left <= 0
    
    try:
        # If trial has ended OR user requested skip_ai:
        if trial_ended or skip_ai:
            title_fallback = raw_text.split("\n")[0][:30] + ("..." if len(raw_text.split("\n")[0]) > 30 or len(raw_text) > 30 else "")
            payload = {
                "user_id": ctx.user.id,
                "raw_text": raw_text,
                "category": "Plain Text",
                "structured_content": {
                    "title": title_fallback,
                    "markdown": raw_text
                }
            }
        else:
            # Call AI service with the (possibly truncated) text
            ai_result = analyze_note_content(
                ai_text,
                prompt_type=note_data.prompt_type,
                custom_prompt=note_data.custom_prompt
            )
            
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
        
        note_res = res.data[0]
        note_res["trial_ended"] = trial_ended
        return note_res
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

@router.put("/{note_id}")
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    ctx: UserContext = Depends(get_user_context)
):
    raw_text = note_data.raw_text
    skip_ai = note_data.skip_ai
    
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
        
    # Check trial
    trial_days_left = get_user_trial_days_remaining(ctx.user.created_at)
    trial_ended = trial_days_left <= 0
        
    try:
        # 3. Enforce ownership and check existence
        existing = ctx.client.table("notes").select("user_id, title_is_custom, structured_content").eq("id", note_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
            
        existing_note = existing.data[0]
        note_owner = existing_note["user_id"]
        if str(note_owner).lower() != str(ctx.user.id).lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this note."
            )

        # Capture any user-set custom title before we overwrite structured_content
        title_is_custom = existing_note.get("title_is_custom", False)
        custom_title = (
            existing_note.get("structured_content", {}).get("title")
            if title_is_custom else None
        )

        if trial_ended or skip_ai:
            payload = {
                "raw_text": raw_text
            }
            if note_data.category is not None:
                payload["category"] = note_data.category
            else:
                payload["category"] = "Plain Text"

            if note_data.structured_content is not None:
                sc = note_data.structured_content
                if title_is_custom and custom_title:
                    sc = dict(sc)
                    sc["title"] = custom_title
                payload["structured_content"] = sc
            else:
                title_fallback = custom_title if title_is_custom and custom_title else (
                    raw_text.split("\n")[0][:30] + ("..." if len(raw_text.split("\n")[0]) > 30 or len(raw_text) > 30 else "")
                )
                payload["structured_content"] = {
                    "title": title_fallback,
                    "markdown": raw_text
                }
        else:
            # 4. Re-run AI service (full processing)
            ai_result = analyze_note_content(
                ai_text,
                prompt_type=note_data.prompt_type,
                custom_prompt=note_data.custom_prompt
            )
            
            structured = ai_result["structured_content"]
            # If user has a custom title, preserve it — don't let AI overwrite it
            if title_is_custom and custom_title:
                structured = dict(structured)
                structured["title"] = custom_title

            payload = {
                "raw_text": raw_text,
                "category": ai_result["category"],
                "structured_content": structured
            }
        
        res = ctx.client.table("notes").update(payload).eq("id", note_id).execute()
        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update note"
            )
        
        note_res = res.data[0]
        note_res["trial_ended"] = trial_ended
        return note_res
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update note: {str(e)}"
        )

@router.patch("/{note_id}/title")
async def rename_note_title(
    note_id: str,
    title_data: NoteRenameTitle,
    ctx: UserContext = Depends(get_user_context)
):
    new_title = title_data.title.strip()
    if not new_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be empty."
        )
    if len(new_title) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title must be 100 characters or fewer."
        )
    try:
        existing = ctx.client.table("notes").select("user_id, structured_content").eq("id", note_id).execute()
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

        note_owner = existing.data[0]["user_id"]
        if str(note_owner).lower() != str(ctx.user.id).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update this note.")

        # Merge new title into existing structured_content
        current_sc = existing.data[0].get("structured_content") or {}
        updated_sc = dict(current_sc)
        updated_sc["title"] = new_title

        res = ctx.client.table("notes").update({
            "structured_content": updated_sc,
            "title_is_custom": True
        }).eq("id", note_id).execute()

        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to rename note")

        return res.data[0]
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to rename note title: {str(e)}"
        )

@router.post("/migrate")
async def migrate_notes(
    payload: NotesMigrateRequest,
    ctx: UserContext = Depends(get_user_context)
):
    if not payload.notes:
        return {"status": "success", "message": "No notes to migrate", "count": 0}
        
    # Check trial
    trial_days_left = get_user_trial_days_remaining(ctx.user.created_at)
    trial_ended = trial_days_left <= 0
        
    try:
        db_notes = []
        for item in payload.notes:
            if not item.raw_text.strip():
                continue
            
            if trial_ended:
                title_fallback = item.raw_text.split("\n")[0][:30] + ("..." if len(item.raw_text.split("\n")[0]) > 30 or len(item.raw_text) > 30 else "")
                db_notes.append({
                    "user_id": ctx.user.id,
                    "raw_text": item.raw_text,
                    "category": "Plain Text",
                    "structured_content": {
                        "title": title_fallback,
                        "markdown": f"<p>{item.raw_text}</p>"
                    },
                    "created_at": item.created_at
                })
            else:
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
