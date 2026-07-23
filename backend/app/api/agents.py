from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from ..schemas.agent import AgentCreate, AgentResponse
from ..utils.db import fetch_agents, insert_agent, delete_agent_by_id
from .auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("", response_model=List[AgentResponse])
def get_agents(current_user: dict = Depends(get_current_user)):
    try:
        return fetch_agents(username=current_user["username"], role=current_user["role"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch agents: {e}"
        )

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(payload: AgentCreate):
    agent_id = payload.name.lower().strip().replace(" ", "-").replace("_", "-")
    # Clean ID characters
    agent_id = "".join(c for c in agent_id if c.isalnum() or c == "-")
    
    try:
        # Check if agent already exists
        existing_agents = fetch_agents()
        if any(a["id"] == agent_id for a in existing_agents):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An expert with ID '{agent_id}' already exists."
            )
            
        return insert_agent(agent_id, payload.name, payload.owner)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent: {e}"
        )

@router.delete("/{agent_id}")
def delete_agent(agent_id: str):
    try:
        success = delete_agent_by_id(agent_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent '{agent_id}' not found."
            )
        return {"deleted": True, "agentId": agent_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete agent: {e}"
        )
