from fastapi import APIRouter
from typing import Dict, Any, List
from ..utils.db import fetch_dashboard_stats, fetch_recent_uploads, fetch_recent_activity

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=Dict[str, Any])
def get_dashboard_stats():
    """Retrieve top-level statistics for the dashboard."""
    return fetch_dashboard_stats()

@router.get("/recent-uploads", response_model=List[Dict[str, Any]])
def get_recent_uploads():
    """Retrieve the most recently uploaded documents."""
    return fetch_recent_uploads()

@router.get("/recent-activity", response_model=List[Dict[str, Any]])
def get_recent_activity():
    """Retrieve the recent activity feed."""
    return fetch_recent_activity()
