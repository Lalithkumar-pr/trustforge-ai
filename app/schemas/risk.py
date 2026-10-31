from pydantic import BaseModel, Field
from typing import List

class RiskItem(BaseModel):
    risk_id: str
    category: str = Field(description="security, compliance, accuracy, safety, hallucination")
    description: str
    severity: str = Field(description="critical, high, medium, low")
    source_ids: List[str]
    reasoning: str
    recommended_tests: int = 3

class RiskRegister(BaseModel):
    risks: List[RiskItem]

