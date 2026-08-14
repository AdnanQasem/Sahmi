# Security Hardening Report

## Access control and privacy

- Conversation and message querysets are restricted to authenticated participants. Staff status alone grants no conversation access.
- Message sender is always derived from `request.user`; submitted sender fields are ignored.
- Soft-deleted messages serialize an empty body and never expose the original text.
- Notifications and preferences are always resolved through `request.user`.
- Public project responses omit email, phone, KYC data, private documents, supporting documents, and verification notes.
- Audit endpoints are read-only and staff-only.

## Roles and financial state

- Public registration accepts only investor and entrepreneur roles.
- Profile API rejects attempts to mutate role/staff/superuser/group/permission fields.
- Investment investor and status fields are read-only; confirmation is staff-only and cancellation is constrained to pending owned investments.
- Non-staff project reassignment is denied. Updates, reassignments, cancellations, confirmations, and deletions synchronize affected project totals using atomic financial-state boundaries.

## Tokens and throttling

- JWT refresh rotation and blacklist-after-rotation are enabled.
- Logout blacklists the submitted refresh token.
- Endpoint-specific throttle scopes are configurable through environment-backed Django settings. A custom scoped base fixes DRF APIView scope resolution so the declared rates are actually enforced.

## Audit data minimization

- Audit metadata recursively removes password, token, authorization, secret, private message-body, and document-content keys.
- Login/logout audit records never store credentials or token values.
- Message notifications contain a generic summary, never the private message body.

## Residual operational risks

- The repository development secret is intentionally a weak placeholder and emitted JWT key-length warnings in tests. Production must supply a strong `DJANGO_SECRET_KEY` through environment configuration.
- Rate limiting uses Django's configured cache. Multi-instance production deployments require a shared cache to enforce global limits consistently.
- Frontend bundles remain large and Browserslist data is stale; these are performance/maintenance warnings, not failures in this security scope.
- OpenAPI generation completes with zero errors but retains pre-existing type-hint and enum-name warnings.