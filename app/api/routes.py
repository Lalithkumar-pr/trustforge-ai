import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    EvaluationModel, RiskModel, TestCaseModel, ExecutionResultModel,
    VerificationFindingModel, RegressionTestModel, HumanApprovalModel, AuditEventModel
)
from app.schemas.target import TargetChatRequest, TargetChatResponse
from app.schemas.evaluation import (
    EvaluationCreate, EvaluationResponse, EvaluationReport,
    HumanApprovalRequest, AdaptScenarioRequest
)
from app.schemas.scoring import DimensionScores, ReleaseRecommendation
from app.schemas.risk import RiskItem
from app.schemas.test_case import TestCaseItem
from app.schemas.verification import VerificationFindingItem, EvidenceItem
from app.target.helpdesk import target_helpdesk_service
from app.target.policies import get_all_policies, reset_policies
from app.agents.orchestrator import orchestrator
from app.config import settings
from app.core.gemini_client import target_llm, evaluator_llm

logger = logging.getLogger("trustforge.api")
router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "gemini_configured": target_llm.is_configured() and evaluator_llm.is_configured(),
        "gemini_model": settings.GEMINI_MODEL
    }

@router.get("/policies")
def list_policies():
    """Lists current active enterprise synthetic policy documents."""
    return get_all_policies()

@router.post("/policies/reset")
def reset_policy_catalog():
    """Resets policies back to the default synthetic baselines."""
    reset_policies()
    return {"message": "Policy store reset to baseline synthetic standards."}

@router.post("/target/chat", response_model=TargetChatResponse)
def target_chat(request: TargetChatRequest):
    """
    Independently callable Enterprise IT Helpdesk AI endpoint.
    Simulates target application with optional configurable vulnerability fixtures.
    """
    try:
        response = target_helpdesk_service.process_request(request)
        return response
    except Exception as e:
        logger.error(f"Error in target_chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluations", response_model=Dict[str, Any])
async def create_evaluation(
    req: EvaluationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Initializes a new TrustForge Agentic Quality Evaluation.
    Returns evaluation ID immediately and executes stages in a background task.
    """
    eval_id = orchestrator.create_evaluation(req)
    # Launch async evaluation lifecycle
    background_tasks.add_task(orchestrator.run_evaluation_lifecycle, eval_id)
    return {
        "id": eval_id,
        "status": "PENDING",
        "message": "Evaluation initialized. Agentic lifecycle running in background."
    }

@router.get("/evaluations", response_model=List[Dict[str, Any]])
def list_evaluations(db: Session = Depends(get_db)):
    """Lists recent evaluations."""
    evals = db.query(EvaluationModel).order_by(EvaluationModel.created_at.desc()).limit(20).all()
    results = []
    for e in evals:
        scores = json.loads(e.scores or "{}")
        rec = json.loads(e.release_recommendation or "{}")
        results.append({
            "id": e.id,
            "status": e.status,
            "current_stage": e.current_stage,
            "progress": e.progress,
            "composite_score": scores.get("composite_score", 0.0),
            "release_decision": rec.get("decision", "PENDING"),
            "summary": e.summary,
            "created_at": e.created_at.isoformat() if e.created_at else "",
            "updated_at": e.updated_at.isoformat() if e.updated_at else ""
        })
    return results

@router.get("/evaluations/{id}", response_model=Dict[str, Any])
def get_evaluation(id: str, db: Session = Depends(get_db)):
    """Fetches real-time status and stage of an ongoing or completed evaluation."""
    e = db.query(EvaluationModel).filter(EvaluationModel.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    scores_dict = json.loads(e.scores or "{}")
    rec_dict = json.loads(e.release_recommendation or "{}")
    target_config = json.loads(e.target_config or "{}")

    # Count risks and tests
    risk_count = db.query(RiskModel).filter(RiskModel.evaluation_id == id).count()
    test_count = db.query(TestCaseModel).filter(TestCaseModel.evaluation_id == id).count()
    passed_count = db.query(VerificationFindingModel).filter(
        VerificationFindingModel.evaluation_id == id,
        VerificationFindingModel.status == "PASS"
    ).count()
    failed_count = db.query(VerificationFindingModel).filter(
        VerificationFindingModel.evaluation_id == id,
        VerificationFindingModel.status != "PASS"
    ).count()

    return {
        "id": e.id,
        "status": e.status,
        "current_stage": e.current_stage,
        "progress": e.progress,
        "target_config": target_config,
        "scores": scores_dict,
        "release_recommendation": rec_dict,
        "summary": e.summary,
        "error_message": e.error_message,
        "risk_count": risk_count,
        "test_count": test_count,
        "passed_count": passed_count,
        "failed_count": failed_count,
        "created_at": e.created_at.isoformat() if e.created_at else "",
        "updated_at": e.updated_at.isoformat() if e.updated_at else ""
    }

@router.get("/evaluations/{id}/report")
def get_evaluation_report(id: str, db: Session = Depends(get_db)):
    """Fetches full comprehensive audit report for an evaluation."""
    e = db.query(EvaluationModel).filter(EvaluationModel.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    risks = db.query(RiskModel).filter(RiskModel.evaluation_id == id).all()
    test_cases = db.query(TestCaseModel).filter(TestCaseModel.evaluation_id == id).all()
    exec_results = db.query(ExecutionResultModel).filter(ExecutionResultModel.evaluation_id == id).all()
    findings = db.query(VerificationFindingModel).filter(VerificationFindingModel.evaluation_id == id).all()
    approvals = db.query(HumanApprovalModel).filter(HumanApprovalModel.evaluation_id == id).all()
    audit_events = db.query(AuditEventModel).filter(AuditEventModel.evaluation_id == id).order_by(AuditEventModel.timestamp.asc()).all()

    return {
        "evaluation": {
            "id": e.id,
            "status": e.status,
            "current_stage": e.current_stage,
            "progress": e.progress,
            "scores": json.loads(e.scores or "{}"),
            "release_recommendation": json.loads(e.release_recommendation or "{}"),
            "target_config": json.loads(e.target_config or "{}"),
            "summary": e.summary,
            "created_at": e.created_at.isoformat() if e.created_at else "",
            "updated_at": e.updated_at.isoformat() if e.updated_at else ""
        },
        "risks": [
            {
                "risk_id": r.risk_id,
                "category": r.category,
                "description": r.description,
                "severity": r.severity,
                "source_ids": json.loads(r.source_ids or "[]"),
                "reasoning": r.reasoning,
                "recommended_tests": r.recommended_tests
            }
            for r in risks
        ],
        "test_cases": [
            {
                "test_id": tc.test_id,
                "risk_id": tc.risk_id,
                "category": tc.category,
                "prompt": tc.prompt,
                "expected_behavior": tc.expected_behavior,
                "severity": tc.severity,
                "source_ids": json.loads(tc.source_ids or "[]"),
                "generation_reason": tc.generation_reason,
                "is_regression": tc.is_regression
            }
            for tc in test_cases
        ],
        "execution_results": [
            {
                "test_id": er.test_id,
                "raw_prompt": er.raw_prompt,
                "actual_answer": er.actual_answer,
                "sources_cited": json.loads(er.sources_cited or "[]"),
                "retrieved_context": json.loads(er.retrieved_context or "[]"),
                "latency_ms": er.latency_ms,
                "status_code": er.status_code,
                "tool_calls": json.loads(er.tool_calls or "[]")
            }
            for er in exec_results
        ],
        "findings": [
            {
                "test_id": f.test_id,
                "status": f.status,
                "failure_type": f.failure_type,
                "severity": f.severity,
                "evidence": json.loads(f.evidence or "[]"),
                "judge_reasoning": f.judge_reasoning
            }
            for f in findings
        ],
        "approvals": [
            {
                "id": a.id,
                "decision": a.decision,
                "reviewer": a.reviewer,
                "comments": a.comments,
                "previous_recommendation": a.previous_recommendation,
                "timestamp": a.timestamp.isoformat() if a.timestamp else ""
            }
            for a in approvals
        ],
        "audit_events": [
            {
                "event_type": ae.event_type,
                "details": json.loads(ae.details or "{}"),
                "timestamp": ae.timestamp.isoformat() if ae.timestamp else ""
            }
            for ae in audit_events
        ]
    }

@router.post("/evaluations/{id}/adapt")
def adapt_evaluation(id: str, req: AdaptScenarioRequest):
    """
    Adaptive Jury Scenario endpoint:
    Accepts new policy or scenario, diffs with existing policy, generates targeted delta tests,
    executes tests, updates scores, and updates release recommendation.
    """
    try:
        result = orchestrator.execute_adaptation_workflow(id, req)
        return result
    except Exception as e:
        logger.error(f"Error in adapt_evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluations/{id}/approve")
def approve_evaluation(id: str, req: HumanApprovalRequest, db: Session = Depends(get_db)):
    """
    Human Review and Release Approval workflow.
    Mandatory human sign-off on release decision.
    """
    e = db.query(EvaluationModel).filter(EvaluationModel.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    rec = json.loads(e.release_recommendation or "{}")
    previous_rec = rec.get("decision", "UNKNOWN")

    approval = HumanApprovalModel(
        evaluation_id=id,
        decision=req.decision,
        reviewer=req.reviewer,
        comments=req.comments,
        previous_recommendation=previous_rec
    )
    db.add(approval)

    db.add(AuditEventModel(
        evaluation_id=id,
        event_type="HUMAN_APPROVAL_RECORDED",
        details=json.dumps({
            "decision": req.decision,
            "reviewer": req.reviewer,
            "previous_recommendation": previous_rec,
            "comments": req.comments
        })
    ))
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Human review decision '{req.decision}' recorded by {req.reviewer}.",
        "previous_recommendation": previous_rec
    }

@router.get("/regression")
def list_regression_tests(db: Session = Depends(get_db)):
    """Lists saved regression test suite."""
    regs = db.query(RegressionTestModel).order_by(RegressionTestModel.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "original_evaluation_id": r.original_evaluation_id,
            "test_id": r.test_id,
            "category": r.category,
            "prompt": r.prompt,
            "expected_behavior": r.expected_behavior,
            "severity": r.severity,
            "previous_result": r.previous_result,
            "current_result": r.current_result,
            "status": r.status,
            "last_run_at": r.last_run_at.isoformat() if r.last_run_at else "",
            "created_at": r.created_at.isoformat() if r.created_at else ""
        }
        for r in regs
    ]
