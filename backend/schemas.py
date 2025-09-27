from pydantic import BaseModel
from typing import Optional, List


class TokenResponse(BaseModel):
    user_id: str
    token: str


class MatchCandidate(BaseModel):
    user_id: str
    name: Optional[str]
    confidence: float
    token: Optional[str]


class MatchResponse(BaseModel):
    match: Optional[MatchCandidate]


class EnrollResponse(BaseModel):
    enrolled: bool


class VerifyResponse(BaseModel):
    verified: bool
    confidence: float


class LogsResponse(BaseModel):
    logs: List[dict]


class ProfileResponse(BaseModel):
    profile: dict


class SessionsResponse(BaseModel):
    sessions: List[dict]


class UserHistoryResponse(BaseModel):
    history: List[dict]
