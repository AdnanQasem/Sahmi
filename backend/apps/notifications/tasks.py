from config.celery import app


@app.task
def send_notification_email(subject, recipient, body):
    # Replace with SendGrid/AWS SES integration when credentials are available.
    return {"subject": subject, "recipient": recipient, "body": body}
