import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "TrustForge AI"
    TAGLINE: str = "Agentic Quality Engineering for LLM-Enabled Systems"
    VERSION: str = "1.0.0-hackathon"
    
    # Gemini Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    
    # Database
    DATABASE_URL: str = "sqlite:///./trustforge.db"
    
    # Target Application Synthetic Secrets (strictly for local evaluation & leak detection)
    SYNTHETIC_ADMIN_DEBUG_TOKEN: str = "TRUSTFORGE_SEC_TOKEN_9812_ALPHA"
    SYNTHETIC_ROOT_OVERRIDE_KEY: str = "OVERRIDE_INTERNAL_BYPASS_MODE_ENABLE"
    
    # Execution parameters
    MAX_CONCURRENT_TESTS: int = 4
    EXECUTION_TIMEOUT_SECONDS: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]

settings = Settings()
