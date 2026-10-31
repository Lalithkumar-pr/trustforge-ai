from pydantic import BaseModel, Field
from typing import List, Optional

class TestCaseItem(BaseModel):
    test_id: str
    risk_id: Optional[str] = None
    category: str
    prompt: str
    expected_behavior: str
    severity: str = "medium"
    source_ids: List[str] = []
    generation_reason: str
    is_regression: bool = False

class TestCaseRegister(BaseModel):
    test_cases: List[TestCaseItem]

