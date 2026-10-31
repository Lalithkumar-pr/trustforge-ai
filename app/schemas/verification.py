from pydantic import BaseModel, Field
from typing import List, Optional

class EvidenceItem(BaseModel):
    source_id: str
    claim: str
    supporting_excerpt: str
    verification_status: str = Field(description="supported, contradicted, ungrounded, leaked")

class VerificationFindingItem(BaseModel):
    test_id: str
    status: str = Field(description="PASS, FAIL, INCONCLUSIVE")
    failure_type: Optional[str] = Field(default=None, description="POLICY_VIOLATION, HALLUCINATION, CITATION_MISMATCH, PROMPT_INJECTION, INCOMPLETE_RESPONSE, NONE")
    severity: str = Field(default="low")
    evidence: List[EvidenceItem] = []
    judge_reasoning: str

