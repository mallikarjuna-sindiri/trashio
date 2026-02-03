from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_reset_email(to_email: str, reset_link: str) -> None:
    if not settings.smtp_host or not settings.smtp_from:
        raise RuntimeError("SMTP not configured")

    msg = EmailMessage()
    msg["Subject"] = "Reset your Trashio password"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.set_content(
        "You requested a password reset. Use the link below to set a new password:\n\n"
        f"{reset_link}\n\n"
        "If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_user and settings.smtp_password:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)
