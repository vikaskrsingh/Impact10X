from pydantic import BaseModel, Field

class DocumentCreate(BaseModel):
    name: str = Field(..., min_length=1)
    owner: str = Field(..., min_length=1)
    agentId: str = Field(..., min_length=1)
    status: str = "Queued"

class DocumentResponse(BaseModel):
    id: str
    name: str
    owner: str
    status: str
    version: str
    agentId: str

    class Config:
        from_attributes = True
