from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import EmailMultiAlternatives
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.html import escape


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, registration, timestamp):
        return f"{registration.pk}{registration.password}{timestamp}{registration.email}{registration.updated_at.isoformat()}"


email_verification_token = EmailVerificationTokenGenerator()


def send_email_confirmation(registration):
    uid = urlsafe_base64_encode(force_bytes(registration.pk))
    token = email_verification_token.make_token(registration)
    verification_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    text = (
        f"Hello {registration.full_name},\n\n"
        "Confirm your email address to finish creating your Sahmi account:\n"
        f"{verification_url}\n\n"
        "If you did not create this account, you can ignore this email.\n\n"
        "مرحباً،\n"
        "يرجى تأكيد بريدك الإلكتروني عبر الرابط أعلاه لإكمال إنشاء حسابك في سهمي."
    )
    safe_name = escape(registration.full_name)
    html = f"""
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a;max-width:600px;margin:auto">
          <h2 style="color:#17845f">Confirm your Sahmi email</h2>
          <p>Hello {safe_name},</p>
          <p>Confirm your email address to finish creating your account.</p>
          <p><a href="{verification_url}" style="display:inline-block;background:#17845f;color:white;padding:12px 20px;border-radius:8px;text-decoration:none">Confirm email address</a></p>
          <p style="font-size:13px;color:#667085">If the button does not work, copy this link:<br>{verification_url}</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0">
          <div dir="rtl" style="text-align:right">
            <h2 style="color:#17845f">تأكيد البريد الإلكتروني لحساب سهمي</h2>
            <p>مرحباً {safe_name}،</p>
            <p>اضغط على الزر أعلاه لتأكيد بريدك الإلكتروني وإكمال إنشاء حسابك.</p>
          </div>
        </div>
    """
    email = EmailMultiAlternatives(
        subject="Confirm your Sahmi email address",
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[registration.email],
    )
    email.attach_alternative(html, "text/html")
    email.send(fail_silently=False)
    return verification_url
