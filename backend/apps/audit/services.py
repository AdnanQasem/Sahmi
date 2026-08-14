"""Explicit audit logging service.

We prefer an explicit ``audit.log(...)`` call from sensitive endpoints over
uncontrolled model signals. Audit metadata MUST NOT include passwords, refresh
tokens, access tokens, private message bodies, or document contents.

``metadata`` is treated as a string-keyed dict of small JSON-safe primitives.
"""

from typing import Any, Iterable, Mapping, Optional, Union

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.audit.models import AuditLog

User = get_user_model()

_FORBIDDEN_KEYS = {
    "password",
    "new_password",
    "current_password",
    "confirm_password",
    "access",
    "refresh",
    "token",
    "body",
    "message_body",
    "document_url",
}
_FORBIDDEN_KEY_FRAGMENTS = ("password", "token", "authorization", "secret", "message_body", "document_content")


def _is_forbidden_key(key):
    normalised = str(key).lower().replace("-", "_")
    return normalised in _FORBIDDEN_KEYS or any(fragment in normalised for fragment in _FORBIDDEN_KEY_FRAGMENTS)


def _sanitise_metadata(value):
    if isinstance(value, Mapping):
        return {
            str(k): _sanitise_metadata(v)
            for k, v in value.items()
            if not _is_forbidden_key(k)
        }
    if isinstance(value, Iterable) and not isinstance(value, (str, bytes, dict)):
        return [_sanitise_metadata(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def log(
    *,
    action: str,
    actor=None,
    target_type: str = "",
    target_id: str = "",
    result: str = AuditLog.Result.SUCCESS,
    metadata: Optional[Union[Mapping, dict]] = None,
    request=None,
) -> AuditLog:
    """Write one audit record. Returns the created AuditLog instance.

    When ``request`` is provided, ``request_id`` (if set), user-agent and IP
    are recorded. ``actor`` defaults to ``request.user`` if available.
    """
    ip_address = None
    user_agent = ""
    request_id = ""
    if request is not None:
        meta = request.META or {}
        forwarded = meta.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        else:
            ip_address = meta.get("REMOTE_ADDR")
        user_agent = meta.get("HTTP_USER_AGENT", "")[:255]
        request_id = (getattr(request, "audit_request_id", None) or "")[:64]
        if actor is None and getattr(request, "user", None) is not None:
            actor = request.user

    safe_metadata = _sanitise_metadata(metadata or {})

    return AuditLog.objects.create(
        actor=actor,
        action=action[:80],
        target_type=target_type[:60],
        target_id=str(target_id)[:64],
        result=result,
        metadata=safe_metadata,
        request_id=request_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_on_commit(**kwargs) -> None:
    """Schedule ``log(...)`` to run after the current transaction commits."""

    transaction.on_commit(lambda: log(**kwargs))
