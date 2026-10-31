from pydantic import BaseModel
from typing import List, Optional

class DimensionScores(BaseModel):
    accuracy: float = 100.0
    groundedness: float = 100.0
    safety: float = 100.0
    security: float = 100.0
    completeness: float = 100.0
    consistency: float = 100.0
    citation_validity: float = 100.0
    composite_score: float = 100.0

class ReleaseRecommendation(BaseModel):
    decision: str = "RELEASE" # RELEASE, CONDITIONAL RELEASE, REJECT
    composite_score: float = 100.0
    critical_failures: int = 0
    high_failures: int = 0
    remediation_conditions: List[str] = []
    summary: str = ""

