@echo off
echo ========================================================
echo Running TrustForge AI Backend Verification Test Suite
echo ========================================================
set PYTHONPATH=.
.\.venv\Scripts\python.exe -m pytest -v tests/test_backend.py
pause

