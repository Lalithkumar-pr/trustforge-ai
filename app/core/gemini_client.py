import logging
from typing import Optional, Any, Dict, List
from dotenv import load_dotenv
load_dotenv()

from app.config import settings

logger = logging.getLogger("trustforge.gemini")

FALLBACK_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.8-flash",
]

class GeminiNotConfiguredError(Exception):
    """Raised when an operation requires the Gemini API key but none is configured."""
    pass

class TargetGeminiClient:
    """
    Dedicated Gemini client wrapper for System A: Target Helpdesk Application.
    Configured strictly for IT helpdesk assistance persona with policy grounding.
    """
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        import os
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        self.model_name = model or os.getenv("GEMINI_MODEL") or settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"TargetGeminiClient initialized with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client for Target: {e}")
                self._client = None

    def is_configured(self) -> bool:
        return self._client is not None

    def generate(self, prompt: str, system_instruction: str, temperature: float = 0.2) -> str:
        if not self._client:
            raise GeminiNotConfiguredError(
                "Gemini API key is not configured for Target Helpdesk. "
                "Please configure GEMINI_API_KEY in environment or .env file."
            )
        from google.genai import types
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=1000
        )
        
        # Try configured model, then fallback candidates
        candidate_models = [self.model_name] + [m for m in FALLBACK_MODELS if m != self.model_name]
        last_error = None

        for mod in candidate_models:
            try:
                response = self._client.models.generate_content(
                    model=mod,
                    contents=prompt,
                    config=config
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"TargetGeminiClient model '{mod}' attempt failed: {e}. Trying fallback...")
                last_error = e

        logger.error(f"TargetGeminiClient all model candidates failed: {last_error}")
        raise last_error


class TrustForgeGeminiClient:
    """
    Dedicated Gemini client wrapper for System B: TrustForge Evaluation Platform.
    Configured for analytical verification, risk intelligence, test generation, and adaptive reasoning.
    """
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        import os
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        self.model_name = model or os.getenv("GEMINI_MODEL") or settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"TrustForgeGeminiClient initialized with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client for TrustForge: {e}")
                self._client = None

    def is_configured(self) -> bool:
        return self._client is not None

    def generate(self, prompt: str, system_instruction: str, temperature: float = 0.1) -> str:
        if not self._client:
            raise GeminiNotConfiguredError(
                "Gemini API key is not configured for TrustForge Evaluator. "
                "Please configure GEMINI_API_KEY in environment or .env file."
            )
        from google.genai import types
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=2048
        )
        
        candidate_models = [self.model_name] + [m for m in FALLBACK_MODELS if m != self.model_name]
        last_error = None

        for mod in candidate_models:
            try:
                response = self._client.models.generate_content(
                    model=mod,
                    contents=prompt,
                    config=config
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"TrustForgeGeminiClient model '{mod}' attempt failed: {e}. Trying fallback...")
                last_error = e

        logger.error(f"TrustForgeGeminiClient all model candidates failed: {last_error}")
        raise last_error

# Independent singleton instances
target_llm = TargetGeminiClient()
evaluator_llm = TrustForgeGeminiClient()
