import time
import logging
from typing import List, Dict, Any
from app.config import settings
from app.schemas.test_case import TestCaseItem
from app.schemas.target import TargetChatRequest, TargetChatResponse, TargetVulnerabilitiesConfig
from app.target.helpdesk import target_helpdesk_service

logger = logging.getLogger("trustforge.executor")

class ExecutionRecord:
    def __init__(
        self,
        test_id: str,
        raw_prompt: str,
        actual_response: TargetChatResponse,
        latency_ms: float,
        status_code: int = 200,
        error: str = ""
    ):
        self.test_id = test_id
        self.raw_prompt = raw_prompt
        self.actual_response = actual_response
        self.latency_ms = latency_ms
        self.status_code = status_code
        self.error = error

class ExecutionEngine:
    """
    Executes dynamically generated test cases against the live Target Helpdesk AI.
    Features:
    - Real invocation of Target Helpdesk application
    - Latency benchmarking in milliseconds
    - Tool call & citation tracking
    - Supports both synchronous and asynchronous invocation
    """
    def __init__(self, concurrency_limit: int = None):
        self.concurrency_limit = concurrency_limit or settings.MAX_CONCURRENT_TESTS

    def execute_suite(
        self,
        test_cases: List[TestCaseItem],
        vulnerabilities: TargetVulnerabilitiesConfig
    ) -> List[ExecutionRecord]:
        logger.info(f"ExecutionEngine: Starting execution of {len(test_cases)} tests...")
        records: List[ExecutionRecord] = []
        for tc in test_cases:
            rec = self._execute_single_test(tc, vulnerabilities)
            records.append(rec)
        logger.info(f"ExecutionEngine: Completed execution of {len(records)} test runs.")
        return records

    def _execute_single_test(
        self,
        test_case: TestCaseItem,
        vulnerabilities: TargetVulnerabilitiesConfig
    ) -> ExecutionRecord:
        start_time = time.perf_counter()
        try:
            request = TargetChatRequest(
                prompt=test_case.prompt,
                vulnerabilities=vulnerabilities
            )
            # Execute directly against real target application
            response: TargetChatResponse = target_helpdesk_service.process_request(request)
            latency = round((time.perf_counter() - start_time) * 1000, 2)
            
            return ExecutionRecord(
                test_id=test_case.test_id,
                raw_prompt=test_case.prompt,
                actual_response=response,
                latency_ms=latency,
                status_code=200
            )
        except Exception as e:
            latency = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"Error executing test {test_case.test_id}: {e}")
            return ExecutionRecord(
                test_id=test_case.test_id,
                raw_prompt=test_case.prompt,
                actual_response=TargetChatResponse(
                    answer=f"Execution error: {str(e)}",
                    sources=[],
                    retrieved_context=[]
                ),
                latency_ms=latency,
                status_code=500,
                error=str(e)
            )

executor_service = ExecutionEngine()
