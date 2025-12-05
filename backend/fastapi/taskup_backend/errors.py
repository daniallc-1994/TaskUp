from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ErrorDetails(BaseModel):
    code: str
    message: str
    type: str
    http_status: int
    field_errors: Optional[Dict[str, list[str]]] = None
    details: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None
    retryable: bool = False
    docs_url: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetails


class TaskUpError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        type: str = "internal",
        http_status: int = 500,
        field_errors: Optional[Dict[str, list[str]]] = None,
        details: Optional[Dict[str, Any]] = None,
        retryable: bool = False,
    ):
        self.code = code
        self.message = message
        self.type = type
        self.http_status = http_status
        self.field_errors = field_errors
        self.details = details
        self.retryable = retryable
        super().__init__(message)


def _docs_url(code: str) -> str:
    return f"https://docs.taskup.no/errors/{code}"


def error_response_from_taskup_error(exc: TaskUpError, correlation_id: str) -> JSONResponse:
    body = ErrorResponse(
        error=ErrorDetails(
            code=exc.code,
            message=exc.message,
            type=exc.type,
            http_status=exc.http_status,
            field_errors=exc.field_errors,
            details=exc.details,
            correlation_id=correlation_id,
            retryable=exc.retryable,
            docs_url=_docs_url(exc.code),
        )
    )
    return JSONResponse(status_code=exc.http_status, content=body.model_dump())


def validation_error(field_errors: Dict[str, list[str]], message: str = "Validation failed", http_status: int = 400) -> TaskUpError:
    return TaskUpError(
        code="VALIDATION_ERROR",
        message=message,
        type="validation",
        http_status=http_status,
        field_errors=field_errors,
    )


def auth_error(code: str, message: str, http_status: int = 401) -> TaskUpError:
    return TaskUpError(code=code, message=message, type="auth", http_status=http_status)


def permission_error(code: str, message: str = "Forbidden", http_status: int = 403) -> TaskUpError:
    return TaskUpError(code=code, message=message, type="permission", http_status=http_status)


def not_found_error(code: str = "RESOURCE_NOT_FOUND", message: str = "Resource not found") -> TaskUpError:
    return TaskUpError(code=code, message=message, type="not_found", http_status=404)


def conflict_error(code: str, message: str) -> TaskUpError:
    return TaskUpError(code=code, message=message, type="conflict", http_status=409)


def rate_limit_error(retry_after_seconds: int) -> TaskUpError:
    return TaskUpError(
        code="RATE_LIMIT_EXCEEDED",
        message="Rate limit exceeded",
        type="rate_limit",
        http_status=429,
        details={"retry_after_seconds": retry_after_seconds},
        retryable=True,
    )


def internal_error(message: str = "Internal server error") -> TaskUpError:
    return TaskUpError(code="INTERNAL_ERROR", message=message, type="internal", http_status=500)


def correlation_id_from_request(request: Request) -> str:
    cid = getattr(request.state, "correlation_id", None)
    if not cid:
        cid = str(uuid.uuid4())
        request.state.correlation_id = cid
    return cid

