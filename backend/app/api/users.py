from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from .auth import get_current_user
from ..utils.db import fetch_users_with_access, update_user_access

router = APIRouter(prefix="/users", tags=["users"])

class UpdateAccessRequest(BaseModel):
    agent_ids: List[str]

@router.get("")
def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all users"
        )
        
    try:
        return fetch_users_with_access()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {e}"
        )

@router.put("/{username}/agents")
def update_access(username: str, payload: UpdateAccessRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify user access"
        )
        
    try:
        success = update_user_access(username, payload.agent_ids)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{username}' not found"
            )
        return {"success": True, "message": f"Updated access for {username}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update access: {e}"
        )
