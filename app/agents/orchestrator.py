import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.db.session import SessionLocal
from app.db.models import (
    EvaluationModel, RiskModel, TestCaseModel, ExecutionResultModel,
    VerificationFindingModel, RegressionTestModel, AuditEventModel, PolicyDocumentModel
)
from app.schemas.evaluation import EvaluationCreate, AdaptScenarioRequest
from app.schemas.target import TargetVulnerabilitiesConfig
from app.schemas.verification import VerificationFindingItem
from app.target.policies import get_all_policies, get_policy, update_policy, PolicyDocument
from app.agents.risk_agent import risk_agent
from app.agents.test_agent import test_agent
from app.agents.verification_agent import verification_agent
from app.agents.adaptation_agent import adaptation_agent
from app.services.executor import executor_service
from app.evaluators.scoring import quality_scorer
from app.evaluators.release import release_gate_engine

logger = logging.getLogger("trustforge.orchestrator")

def utc_now():
    return datetime.now(timezone.utc)

class EvaluationOrchestrator:
    """
    Agent 1: Orchestrator.
    Manages the lifecycle of quality engineering workflows, coordinates specialized agents,
    updates database state, and ensures human auditability.
    """

    def create_evaluation(self, req: EvaluationCreate) -> str:
        eval_id = str(uuid.uuid4())
        db = SessionLocal()
        try:
            config = req.target_config or TargetVulnerabilitiesConfig()
            new_eval = EvaluationModel(
                id=eval_id,
                status="PENDING",
                current_stage="INITIALIZING",
                progress=0,
                target_config=config.model_dump_json(),
                scores="{}",
                release_recommendation="{}",
                summary=f"Evaluation initialized: {req.name}"
            )
            db.add(new_eval)

            # Record initial audit event
            db.add(AuditEventModel(
                evaluation_id=eval_id,
                event_type="EVALUATION_INITIALIZED",
                details=json.dumps({
                    "name": req.name,
                    "target_config": config.model_dump()
                })
            ))
            db.commit()
            return eval_id
        finally:
            db.close()

    def run_evaluation_lifecycle(self, eval_id: str) -> None:
        """
        Executes the 6-stage Quality Engineering Lifecycle.
        """
        logger.info(f"Orchestrator: Commencing evaluation workflow for {eval_id}")
        db = SessionLocal()
        try:
            eval_record = db.query(EvaluationModel).filter(EvaluationModel.id == eval_id).first()
            if not eval_record:
                logger.error(f"Evaluation {eval_id} not found in database!")
                return

            eval_record.status = "RUNNING"
            eval_record.current_stage = "RISK_ANALYSIS"
            eval_record.progress = 15
            db.commit()

            target_config_dict = json.loads(eval_record.target_config or "{}")
            target_config = TargetVulnerabilitiesConfig(**target_config_dict)

            # Stage 1: Risk Analysis via Agent 2
            logger.info(f"[{eval_id}] Stage 1: Risk Analysis...")
            active_policies = get_all_policies()
            risks = risk_agent.analyze_risks(
                policies=active_policies,
                target_config=target_config
            )

            # Persist risks
            for r in risks:
                db.add(RiskModel(
                    evaluation_id=eval_id,
                    risk_id=r.risk_id,
                    category=r.category,
                    description=r.description,
                    severity=r.severity,
                    source_ids=json.dumps(r.source_ids),
                    reasoning=r.reasoning,
                    recommended_tests=r.recommended_tests
                ))
            db.commit()

            # Stage 2: Dynamic Test Generation via Agent 3
            eval_record.current_stage = "TEST_GENERATION"
            eval_record.progress = 35
            db.commit()

            logger.info(f"[{eval_id}] Stage 2: Dynamic Test Generation...")
            # Query existing active regressions (prioritize most recent)
            active_regs = db.query(RegressionTestModel).filter(
                RegressionTestModel.status == "ACTIVE"
            ).order_by(RegressionTestModel.created_at.desc()).limit(3).all()
            reg_dicts = [
                {
                    "test_id": reg.test_id,
                    "category": reg.category,
                    "prompt": reg.prompt,
                    "expected_behavior": reg.expected_behavior,
                    "severity": reg.severity,
                    "source_ids": ["IT-001"]
                }
                for reg in active_regs
            ]

            test_cases = test_agent.generate_tests(
                risks=risks,
                regression_tests=reg_dicts
            )

            # Persist test cases
            for tc in test_cases:
                db.add(TestCaseModel(
                    evaluation_id=eval_id,
                    test_id=tc.test_id,
                    risk_id=tc.risk_id,
                    category=tc.category,
                    prompt=tc.prompt,
                    expected_behavior=tc.expected_behavior,
                    severity=tc.severity,
                    source_ids=json.dumps(tc.source_ids),
                    generation_reason=tc.generation_reason,
                    is_regression=tc.is_regression
                ))
            db.commit()

            # Stage 3: Execution via Executor Service
            eval_record.current_stage = "EXECUTION"
            eval_record.progress = 60
            db.commit()

            logger.info(f"[{eval_id}] Stage 3: Executing {len(test_cases)} tests against Target Helpdesk...")
            exec_records = executor_service.execute_suite(
                test_cases=test_cases,
                vulnerabilities=target_config
            )

            # Persist execution results
            for er in exec_records:
                db.add(ExecutionResultModel(
                    evaluation_id=eval_id,
                    test_id=er.test_id,
                    raw_prompt=er.raw_prompt,
                    actual_answer=er.actual_response.answer,
                    sources_cited=json.dumps([s.model_dump() for s in er.actual_response.sources]),
                    retrieved_context=json.dumps([c.model_dump() for c in er.actual_response.retrieved_context]),
                    latency_ms=er.latency_ms,
                    status_code=er.status_code,
                    tool_calls=json.dumps(er.actual_response.tool_calls)
                ))
            db.commit()

            # Stage 4: Verification via Agent 4 & Deterministic Evaluators
            eval_record.current_stage = "VERIFICATION"
            eval_record.progress = 80
            db.commit()

            logger.info(f"[{eval_id}] Stage 4: Verifying actual responses...")
            exec_map = {r.test_id: r for r in exec_records}
            findings = []
            for tc in test_cases:
                rec = exec_map.get(tc.test_id)
                if rec:
                    finding = verification_agent.verify_execution(tc, rec)
                    findings.append(finding)
                    db.add(VerificationFindingModel(
                        evaluation_id=eval_id,
                        test_id=finding.test_id,
                        status=finding.status,
                        failure_type=finding.failure_type,
                        severity=finding.severity,
                        evidence=json.dumps([e.model_dump() for e in finding.evidence]),
                        judge_reasoning=finding.judge_reasoning
                    ))
            db.commit()

            # Stage 5: Scoring and Release Gates
            eval_record.current_stage = "SCORING_AND_RELEASE"
            eval_record.progress = 95
            db.commit()

            logger.info(f"[{eval_id}] Stage 5: Scoring and Release Evaluation...")
            scores = quality_scorer.calculate_scores(findings)
            recommendation = release_gate_engine.evaluate_release_readiness(scores, findings)

            # Stage 6: Update Regression Suite from Failures
            regression_cases = adaptation_agent.extract_regression_cases(eval_id, test_cases, findings)
            for rc in regression_cases:
                # Upsert regression
                existing_reg = db.query(RegressionTestModel).filter(
                    RegressionTestModel.test_id == rc["test_id"]
                ).first()
                if not existing_reg:
                    db.add(RegressionTestModel(
                        original_evaluation_id=eval_id,
                        test_id=rc["test_id"],
                        category=rc["category"],
                        prompt=rc["prompt"],
                        expected_behavior=rc["expected_behavior"],
                        severity=rc["severity"],
                        previous_result=rc["previous_result"],
                        current_result=rc["current_result"],
                        status="ACTIVE"
                    ))
            db.commit()

            # Finalize Evaluation Record
            eval_record.status = "COMPLETED"
            eval_record.current_stage = "COMPLETED"
            eval_record.progress = 100
            eval_record.scores = scores.model_dump_json()
            eval_record.release_recommendation = recommendation.model_dump_json()
            eval_record.summary = (
                f"Evaluation completed. Score: {scores.composite_score}%. "
                f"Recommendation: {recommendation.decision}. "
                f"Pass rate: {sum(1 for f in findings if f.status == 'PASS')}/{len(findings)}."
            )

            db.add(AuditEventModel(
                evaluation_id=eval_id,
                event_type="EVALUATION_COMPLETED",
                details=json.dumps({
                    "composite_score": scores.composite_score,
                    "release_decision": recommendation.decision,
                    "total_tests": len(test_cases),
                    "failed_tests": len(regression_cases)
                })
            ))
            db.commit()
            logger.info(f"[{eval_id}] Lifecycle successfully completed!")

        except Exception as e:
            logger.exception(f"Fatal error in evaluation lifecycle for {eval_id}: {e}")
            eval_record = db.query(EvaluationModel).filter(EvaluationModel.id == eval_id).first()
            if eval_record:
                eval_record.status = "FAILED"
                eval_record.error_message = str(e)
                db.commit()
        finally:
            db.close()

    def execute_adaptation_workflow(
        self,
        eval_id: str,
        req: AdaptScenarioRequest
    ) -> Dict[str, Any]:
        """
        Executes the Adaptive Jury Scenario:
        1. Accepts new policy
        2. Diffs with previous version
        3. Dynamically synthesizes delta test cases
        4. Re-evaluates target application
        5. Updates scores, release recommendations, and regression dataset
        """
        logger.info(f"Orchestrator: Executing adaptive jury workflow for evaluation {eval_id}")
        db = SessionLocal()
        try:
            eval_record = db.query(EvaluationModel).filter(EvaluationModel.id == eval_id).first()
            if not eval_record:
                raise ValueError(f"Evaluation {eval_id} not found.")

            existing_policy = get_policy(req.doc_id)
            new_policy = PolicyDocument(
                doc_id=req.doc_id,
                title=req.title or (existing_policy.title if existing_policy else f"Policy {req.doc_id}"),
                version=req.version or "v3.0-ADAPTED",
                last_updated=datetime.now().strftime("%Y-%m-%d"),
                content=req.new_policy_content,
                important_requirements=req.important_requirements or "Strict compliance with updated clauses."
            )

            # Update active policy store
            update_policy(new_policy)

            # Store in DB policy history
            db.add(PolicyDocumentModel(
                doc_id=new_policy.doc_id,
                title=new_policy.title,
                version=new_policy.version,
                last_updated=new_policy.last_updated,
                content=new_policy.content,
                important_requirements=new_policy.important_requirements,
                is_active=True
            ))
            db.commit()

            # Diff and generate adaptive tests via Agent 5
            diff_summary, affected_risks, targeted_tests = adaptation_agent.analyze_policy_delta(
                new_doc=new_policy,
                existing_doc=existing_policy
            )

            target_config_dict = json.loads(eval_record.target_config or "{}")
            target_config = TargetVulnerabilitiesConfig(**target_config_dict)

            # Execute adaptive tests against target
            exec_records = executor_service.execute_suite(
                test_cases=targeted_tests,
                vulnerabilities=target_config
            )

            exec_map = {r.test_id: r for r in exec_records}
            adaptive_findings = []
            for tc in targeted_tests:
                rec = exec_map.get(tc.test_id)
                if rec:
                    finding = verification_agent.verify_execution(tc, rec)
                    adaptive_findings.append(finding)
                    db.add(TestCaseModel(
                        evaluation_id=eval_id,
                        test_id=tc.test_id,
                        risk_id=tc.risk_id,
                        category=tc.category,
                        prompt=tc.prompt,
                        expected_behavior=tc.expected_behavior,
                        severity=tc.severity,
                        source_ids=json.dumps(tc.source_ids),
                        generation_reason=tc.generation_reason,
                        is_regression=tc.is_regression
                    ))
                    db.add(ExecutionResultModel(
                        evaluation_id=eval_id,
                        test_id=rec.test_id,
                        raw_prompt=rec.raw_prompt,
                        actual_answer=rec.actual_response.answer,
                        sources_cited=json.dumps([s.model_dump() for s in rec.actual_response.sources]),
                        retrieved_context=json.dumps([c.model_dump() for c in rec.actual_response.retrieved_context]),
                        latency_ms=rec.latency_ms,
                        status_code=rec.status_code,
                        tool_calls=json.dumps(rec.actual_response.tool_calls)
                    ))
                    db.add(VerificationFindingModel(
                        evaluation_id=eval_id,
                        test_id=finding.test_id,
                        status=finding.status,
                        failure_type=finding.failure_type,
                        severity=finding.severity,
                        evidence=json.dumps([e.model_dump() for e in finding.evidence]),
                        judge_reasoning=finding.judge_reasoning
                    ))
            db.commit()

            # Fetch all existing findings for this evaluation to recompute overall score
            all_findings_models = db.query(VerificationFindingModel).filter(
                VerificationFindingModel.evaluation_id == eval_id
            ).all()
            all_findings = [
                VerificationFindingItem(
                    test_id=fm.test_id,
                    status=fm.status,
                    failure_type=fm.failure_type,
                    severity=fm.severity,
                    evidence=[e for e in json.loads(fm.evidence or "[]")],
                    judge_reasoning=fm.judge_reasoning
                )
                for fm in all_findings_models
            ]

            # Recalculate scores and release gates
            updated_scores = quality_scorer.calculate_scores(all_findings)
            updated_recommendation = release_gate_engine.evaluate_release_readiness(updated_scores, all_findings)

            eval_record.scores = updated_scores.model_dump_json()
            eval_record.release_recommendation = updated_recommendation.model_dump_json()
            eval_record.summary += f" | Adapted for {new_policy.doc_id} {new_policy.version}."

            # Update regression suite with any new failures
            new_regressions = adaptation_agent.extract_regression_cases(eval_id, targeted_tests, adaptive_findings)
            for nr in new_regressions:
                db.add(RegressionTestModel(
                    original_evaluation_id=eval_id,
                    test_id=nr["test_id"],
                    category=nr["category"],
                    prompt=nr["prompt"],
                    expected_behavior=nr["expected_behavior"],
                    severity=nr["severity"],
                    previous_result=nr["previous_result"],
                    current_result=nr["current_result"],
                    status="ACTIVE"
                ))

            db.add(AuditEventModel(
                evaluation_id=eval_id,
                event_type="POLICY_ADAPTATION_EXECUTED",
                details=json.dumps({
                    "doc_id": req.doc_id,
                    "new_version": new_policy.version,
                    "diff_summary": diff_summary,
                    "adaptive_tests_count": len(targeted_tests),
                    "new_composite_score": updated_scores.composite_score,
                    "new_release_decision": updated_recommendation.decision
                })
            ))
            db.commit()

            return {
                "evaluation_id": eval_id,
                "diff_summary": diff_summary,
                "affected_risks": affected_risks,
                "adaptive_tests_generated": len(targeted_tests),
                "adaptive_findings": [f.model_dump() for f in adaptive_findings],
                "updated_scores": updated_scores.model_dump(),
                "updated_recommendation": updated_recommendation.model_dump()
            }
        finally:
            db.close()

orchestrator = EvaluationOrchestrator()
