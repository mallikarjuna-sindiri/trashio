from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("trashio.email")


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

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
        logger.info("Reset email sent", extra={"to": to_email})
    except Exception:
        logger.exception("Failed to send reset email", extra={"to": to_email})
        raise


def send_welcome_email(to_email: str, full_name: str | None, role: str | None) -> None:
    if not settings.smtp_host or not settings.smtp_from:
        raise RuntimeError("SMTP not configured")

    display_name = full_name or "there"
    role_label = (role or "citizen").capitalize()

    msg = EmailMessage()
    msg["Subject"] = "Welcome to Trashio"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.set_content(
        f"Hi {display_name},\n\n"
        "Thanks for registering with Trashio! Here’s a quick overview of how the platform works:\n\n"
        "1) Report garbage spots with a photo and location (citizens).\n"
        "2) Track status updates as reports are reviewed and assigned.\n"
        "3) Cleaners upload proof of completion, and admins verify closures.\n"
        "4) Citizens earn rewards for verified reports.\n\n"
        f"You’re signed up as a {role_label} user.\n\n"
        "If you need help, just reply to this email.\n\n"
        "— The Trashio Team"
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_user and settings.smtp_password:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)
