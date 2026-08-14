from pathlib import Path

from django.core.exceptions import ValidationError


MAX_PROJECT_DOCUMENT_SIZE = 10 * 1024 * 1024
PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


def validate_project_pdf(upload):
    """Validate project evidence using size, extension, MIME, and signature checks."""
    if upload.size > MAX_PROJECT_DOCUMENT_SIZE:
        raise ValidationError("Project documents may not exceed 10 MB.")
    if Path(upload.name).suffix.lower() != ".pdf":
        raise ValidationError("Project documents must be PDF files.")
    content_type = getattr(upload, "content_type", None)
    if content_type and content_type.lower() not in PDF_CONTENT_TYPES:
        raise ValidationError("The uploaded file does not have a PDF content type.")

    position = upload.tell() if hasattr(upload, "tell") else 0
    signature = upload.read(5)
    if hasattr(upload, "seek"):
        upload.seek(position)
    if signature != b"%PDF-":
        raise ValidationError("The uploaded file is not a valid PDF document.")
