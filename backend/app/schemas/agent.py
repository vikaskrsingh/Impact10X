from pydantic import BaseModel, Field

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1)
    owner: str = Field(..., min_length=1)

class AgentResponse(BaseModel):
    id: str
    name: str
    owner: str
    health: int
    status: str
    documents: int
    questions: int

    class Config:
        from_attributes = True
