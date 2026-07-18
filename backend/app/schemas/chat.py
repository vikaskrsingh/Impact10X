from pydantic import BaseModel, Field
from typing import List

class ChatRequest(BaseModel):
    expertId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)

class ChatResponse(BaseModel):
    id: int
    answer: str
    sources: List[str]
    expert: str
    confidenceScore: int

class ChatFeedbackRequest(BaseModel):
    isHelpful: bool
