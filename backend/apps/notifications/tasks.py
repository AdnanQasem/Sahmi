from config.celery import app


@app.task
def send_notification_email(*args, **kwargs):
    """Email delivery is intentionally outside the current implementation scope."""
    return {"status": "disabled"}