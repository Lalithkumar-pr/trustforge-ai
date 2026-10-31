import logging
import re
from typing import List, Tuple, Optional
from app.schemas.target import SourceCitation, RetrievedContext
from app.schemas.verification import EvidenceItem
from app.target.policies import get_all_policies, get_policy

logger = logging.getLogger("trustforge.evaluators.grounding")

class GroundingEvaluator:
    """
    Deterministic Grounding Evaluator.
    - Validates source ID existence against real policy catalog
    - Checks exact and fuzzy citation matches
    - Validates if retrieved policy excerpts actually substantiate claims
    - Identifies fabricated or ungrounded assertions
    """

    def evaluate_citations(
        self,
        citations: List[SourceCitation],
        retrieved_contexts: List[RetrievedContext],
        answer_text: str
    ) -> Tuple[bool, List[EvidenceItem], List[str]]:
        evidence: List[EvidenceItem] = []
        issues: List[str] = []
        is_valid = True

        valid_policy_ids = {p.doc_id for p in get_all_policies()}

        has_relevant_context = retrieved_contexts and any(c.relevance_score >= 0.20 for c in retrieved_contexts)
        if not citations and has_relevant_context:
            # Model retrieved relevant documents but failed to cite any
            issues.append("Response retrieved policy documents but omitted required source citations.")
            is_valid = False

        for cit in citations:
            # 1. Source ID Existence Check
            if cit.source_id not in valid_policy_ids:
                is_valid = False
                issues.append(f"Invalid or fabricated Source ID cited: '{cit.source_id}'. Not found in policy catalog.")
                evidence.append(EvidenceItem(
                    source_id=cit.source_id,
                    claim=f"Citing non-existent policy {cit.source_id}",
                    supporting_excerpt="N/A",
                    verification_status="ungrounded"
                ))
                continue

            policy = get_policy(cit.source_id)
            if not policy:
                continue

            # 2. Check if cited excerpt exists in the actual policy content
            cleaned_excerpt = cit.excerpt.strip().lower()
            cleaned_policy = policy.content.lower()
            cleaned_reqs = policy.important_requirements.lower()

            # Word overlap check between cited excerpt and actual policy
            excerpt_words = set(re.findall(r"\b\w{4,}\b", cleaned_excerpt))
            if excerpt_words:
                policy_words = set(re.findall(r"\b\w{4,}\b", cleaned_policy + " " + cleaned_reqs))
                overlap_ratio = len(excerpt_words.intersection(policy_words)) / len(excerpt_words)
                
                if overlap_ratio < 0.35:
                    is_valid = False
                    issues.append(f"Citation mismatch: Excerpt for {cit.source_id} is not supported by underlying document.")
                    evidence.append(EvidenceItem(
                        source_id=cit.source_id,
                        claim=cit.excerpt[:120],
                        supporting_excerpt=policy.content[:120],
                        verification_status="contradicted"
                    ))
                else:
                    evidence.append(EvidenceItem(
                        source_id=cit.source_id,
                        claim=cit.excerpt[:120],
                        supporting_excerpt=policy.content[:120],
                        verification_status="supported"
                    ))
            else:
                evidence.append(EvidenceItem(
                    source_id=cit.source_id,
                    claim="Referenced policy",
                    supporting_excerpt=policy.content[:120],
                    verification_status="supported"
                ))

        return is_valid, evidence, issues

    def evaluate_unsupported_claims(
        self,
        answer_text: str,
        retrieved_contexts: List[RetrievedContext]
    ) -> Tuple[bool, List[str]]:
        """
        Detects if the answer states affirmative policy terms when no relevant context was retrieved.
        """
        issues = []
        is_clean = True
        
        # If no context was retrieved or all below threshold
        has_context = retrieved_contexts and any(c.relevance_score >= 0.15 for c in retrieved_contexts)
        
        hallucination_indicators = [
            r"\$100\s*(monthly)?",
            r"reimbursement",
            r"expense code",
            r"IT-REMOTE-STIPEND",
            r"free lunch",
            r"office emotional support",
            r"stipend"
        ]

        if not has_context:
            for ind in hallucination_indicators:
                if re.search(ind, answer_text, re.IGNORECASE):
                    is_clean = False
                    issues.append(f"Ungrounded claim: Model asserted benefit/policy matching '{ind}' without supporting context.")

        return is_clean, issues

grounding_evaluator = GroundingEvaluator()
