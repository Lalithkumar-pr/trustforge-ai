import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class PolicyDocumentModel(Base):
    __tablename__ = "policy_documents"

    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String(50), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    last_updated = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    important_requirements = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)


class EvaluationModel(Base):
    __tablename__ = "evaluations"

    id = Column(String(64), primary_key=True, index=True)
    status = Column(String(50), default="PENDING", index=True) # PENDING, RUNNING, COMPLETED, FAILED
    current_stage = Column(String(50), default="INITIALIZING")  # INITIALIZING, RISK_ANALYSIS, TEST_GENERATION, EXECUTION, VERIFICATION, SCORING_AND_RELEASE, COMPLETED
    progress = Column(Integer, default=0)
    target_config = Column(Text, default="{}") # JSON of TargetVulnerabilitiesConfig
    scores = Column(Text, default="{}") # JSON of dimension scores & composite
    release_recommendation = Column(Text, default="{}") # JSON of release decision
    summary = Column(Text, default="")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    risks = relationship("RiskModel", back_populates="evaluation", cascade="all, delete-orphan")
    test_cases = relationship("TestCaseModel", back_populates="evaluation", cascade="all, delete-orphan")
    execution_results = relationship("ExecutionResultModel", back_populates="evaluation", cascade="all, delete-orphan")
    findings = relationship("VerificationFindingModel", back_populates="evaluation", cascade="all, delete-orphan")
    approvals = relationship("HumanApprovalModel", back_populates="evaluation", cascade="all, delete-orphan")
    audit_events = relationship("AuditEventModel", back_populates="evaluation", cascade="all, delete-orphan")


class RiskModel(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String(64), ForeignKey("evaluations.id"), nullable=False, index=True)
    risk_id = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False) # security, compliance, accuracy, safety, hallucination
    description = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False) # critical, high, medium, low
    source_ids = Column(Text, default="[]") # JSON list
    reasoning = Column(Text, nullable=False)
    recommended_tests = Column(Integer, default=3)
    created_at = Column(DateTime, default=utc_now)

    evaluation = relationship("EvaluationModel", back_populates="risks")


class TestCaseModel(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String(64), ForeignKey("evaluations.id"), nullable=False, index=True)
    test_id = Column(String(50), nullable=False, index=True)
    risk_id = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)
    prompt = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    severity = Column(String(50), default="medium")
    source_ids = Column(Text, default="[]") # JSON list
    generation_reason = Column(Text, nullable=False)
    is_regression = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    evaluation = relationship("EvaluationModel", back_populates="test_cases")


class ExecutionResultModel(Base):
    __tablename__ = "execution_results"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String(64), ForeignKey("evaluations.id"), nullable=False, index=True)
    test_id = Column(String(50), nullable=False, index=True)
    raw_prompt = Column(Text, nullable=False)
    actual_answer = Column(Text, nullable=False)
    sources_cited = Column(Text, default="[]") # JSON list
    retrieved_context = Column(Text, default="[]") # JSON list
    latency_ms = Column(Float, default=0.0)
    status_code = Column(Integer, default=200)
    tool_calls = Column(Text, default="[]") # JSON list
    created_at = Column(DateTime, default=utc_now)

    evaluation = relationship("EvaluationModel", back_populates="execution_results")


class VerificationFindingModel(Base):
    __tablename__ = "verification_findings"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String(64), ForeignKey("evaluations.id"), nullable=False, index=True)
    test_id = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False) # PASS, FAIL, INCONCLUSIVE
    failure_type = Column(String(100), nullable=True) # POLICY_VIOLATION, HALLUCINATION, CITATION_MISMATCH, PROMPT_INJECTION, INCOMPLETE_RESPONSE, NONE
    severity = Column(String(50), default="low") # critical, high, medium, low
    evidence = Column(Text, default="[]") # JSON list of EvidenceItems
    judge_reasoning = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    evaluation = relationship("EvaluationModel", back_populates="findings")


class RegressionTestModel(Base):
    __tablename__ = "regression_tests"

    id = Column(Integer, primary_key=True, index=True)
    original_evaluation_id = Column(String(64), nullable=False)
    test_id = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    prompt = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    severity = Column(String(50), default="medium")
    previous_result = Column(String(50), default="FAIL") # PASS, FAIL
    current_result = Column(String(50), default="FAIL") # PASS, FAIL, PENDING
    last_run_at = Column(DateTime, default=utc_now)
    status = Column(String(50), default="ACTIVE") # ACTIVE, RESOLVED
    created_at = Column(DateTime, default=utc_now)


class HumanApprovalModel(Base):
    __tablename__ = "human_approvals"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String(64), ForeignKey("evaluations.id"), nullable=False, index=True)
    decision = Column(String(50), nullable=False) # APPROVED, REJECTED, CONDITIONAL
    reviewer = Column(String(100), nullable=False)
    comments = Column(Text, nullable=False)
    previous_recommendation = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=utc_now)

    evaluation = relationship("EvaluationModel", back_populates="approvals")


class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String(64), ForeignKey("evaluations.id"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False)
    details = Column(Text, default="{}") # JSON
    timestamp = Column(DateTime, default=utc_now)

    evaluation = relationship("EvaluationModel", back_populates="audit_events")

