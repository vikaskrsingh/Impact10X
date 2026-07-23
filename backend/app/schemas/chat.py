from pydantic import BaseModel, Field
from typing import List

class ChatRequest(BaseModel):
    expertId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    useInternetSearch: bool = False
    sessionId: str = None

class MultiChatRequest(BaseModel):
    expertIds: List[str] = Field(..., min_items=1)
    question: str = Field(..., min_length=1)
    useInternetSearch: bool = False
    sessionId: str = None

class ChatResponse(BaseModel):
    id: int
    answer: str
    sources: List[str]
    expert: str
    confidenceScore: int

class ChatFeedbackRequest(BaseModel):
    isHelpful: bool

class MessageResponse(BaseModel):
    id: int
    user_message: str
    assistant_message: str
    timestamp: str
