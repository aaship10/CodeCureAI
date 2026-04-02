from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime
    class Config:
        from_attributes = True

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- PREDICTION SCHEMAS ---
class PredictionCreate(BaseModel):
    smiles: str

class PredictionResponse(BaseModel):
    id: int
    smiles_string: str
    prediction_result: str
    confidence_score: float
    timestamp: datetime
    class Config:
        from_attributes = True