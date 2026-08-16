from pathlib import Path

from django.core.exceptions import ValidationError

from apps.messaging.models import MAX_MESSAGE_ATTACHMENT_SIZE


ALLOWED_ATTACHMENT_TYPES = {
    ".png": {"image/png"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".gif": {"image/gif"},
    ".webp": {"image/webp"},
    ".pdf": {"application/pdf"},
    ".txt": {"text/plain"},
    ".csv": {"text/csv", "application/csv", "text/plain"},
    ".doc": {"application/msword"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".xls": {"application/vnd.ms-excel"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    ".ppt": {"application/vnd.ms-powerpoint"},
    ".pptx": {"application/vnd.openxmlformats-officedocument.presentationml.presentation"},
}


def validate_message_attachment(upload):
    if upload.size > MAX_MESSAGE_ATTACHMENT_SIZE:
        raise ValidationError("Message attachments may not exceed 10 MB.")
    extension = Path(upload.name).suffix.lower()
    allowed_content_types = ALLOWED_ATTACHMENT_TYPES.get(extension)
    if not allowed_content_types:
        raise ValidationError("This attachment file type is not supported.")
    content_type = (getattr(upload, "content_type", "") or "").lower()
    if content_type not in allowed_content_types:
        raise ValidationError("The attachment content type does not match its file extension.")

    position = upload.tell()
    header = upload.read(12)
    upload.seek(position)
    if extension == ".pdf" and not header.startswith(b"%PDF-"):
        raise ValidationError("The uploaded attachment is not a valid PDF document.")
    image_signatures = {
        ".png": (b"\x89PNG\r\n\x1a\n",),
        ".jpg": (b"\xff\xd8\xff",),
        ".jpeg": (b"\xff\xd8\xff",),
        ".gif": (b"GIF87a", b"GIF89a"),
        ".webp": (b"RIFF",),
    }
    if extension in image_signatures and not any(header.startswith(signature) for signature in image_signatures[extension]):
        raise ValidationError("The uploaded attachment is not a valid image.")
    if extension == ".webp" and header[8:12] != b"WEBP":
        raise ValidationError("The uploaded attachment is not a valid image.")

    return upload
