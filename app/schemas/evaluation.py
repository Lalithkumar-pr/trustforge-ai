from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.schemas.target import TargetVulnerabilitiesConfig
from app.schemas.scoring import DimensionScores, ReleaseRecommendation
from app.schemas.risk import RiskItem
from app.schemas.test_case import TestCaseItem
from app.schemas.verification import VerificationFindingItem

class EvaluationCreate(BaseModel):
    target_config: Optional[TargetVulnerabilitiesConfig] = None
    name: Optional[str] = "IT Helpdesk Compliance & Security Evaluation"
    description: Optional[str] = "Standard Agentic Quality Engineering Evaluation"
    custom_policies: Optional[List[Dict[str, Any]]] = None

class EvaluationResponse(BaseModel):
    id: str
    status: str
    current_stage: str
    progress: int
    target_config: TargetVulnerabilitiesConfig
    scores: Optional[DimensionScores] = None
    release_recommendation: Optional[ReleaseRecommendation] = None
    created_at: str
    updated_at: str

class HumanApprovalRequest(BaseModel):
    decision: str # APPROVED, REJECTED, CONDITIONAL
    reviewer: str
    comments: str

class AdaptScenarioRequest(BaseModel):
    doc_id: str
    title: Optional[str] = None
    version: Optional[str] = None
    new_policy_content: str
    important_requirements: Optional[str] = None
    reason: Optional[str] = "Policy modernization & strict compliance update"

class EvaluationReport(BaseModel):
    evaluation: EvaluationResponse
    risks: List[RiskItem]
    test_cases: List[TestCaseItem]
    findings: List[VerificationFindingItem]
    execution_results: List[Dict[str, Any]]
    approvals: List[Dict[str, Any]]
    audit_events: List[Dict[str, Any]]

