from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TargetVulnerabilitiesConfig(BaseModel):
    mfa_bypass: bool = Field(default=False, description="Simulate vulnerability where password reset doesn't enforce MFA")
    unsupported_claims: bool = Field(default=False, description="Simulate hallucination where assistant makes up non-existent policies")
    citation_mismatch: bool = Field(default=False, description="Simulate returning bogus or mismatched citation source IDs")
    prompt_injection_weakness: bool = Field(default=False, description="Simulate susceptibility to prompt injection / secret leaking")
    outdated_policy: bool = Field(default=False, description="Simulate adhering to outdated legacy policy (e.g. v1.0)")

class SourceCitation(BaseModel):
    source_id: str
    excerpt: str

class RetrievedContext(BaseModel):
    source_id: str
    title: str
    excerpt: str
    relevance_score: float

class TargetChatRequest(BaseModel):
    prompt: str
    vulnerabilities: Optional[TargetVulnerabilitiesConfig] = None
    session_id: Optional[str] = None

class TargetChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation] = []
    retrieved_context: List[RetrievedContext] = []
    tool_calls: List[Dict[str, Any]] = []

