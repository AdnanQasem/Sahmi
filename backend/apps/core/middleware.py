import uuid


class RequestIDMiddleware:
    """Generate or forward an X-Request-ID and expose it on the request object.

    The audit log reads ``request.audit_request_id`` and stores it on the
    resulting AuditLog row, so parallel requests can be correlated.
    """

    HEADER = "HTTP_X_REQUEST_ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        existing = request.META.get(self.HEADER, "")
        if existing:
            request_id = existing[:64]
        else:
            request_id = uuid.uuid4().hex
        request.audit_request_id = request_id
        request.META[self.HEADER] = request_id
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response
