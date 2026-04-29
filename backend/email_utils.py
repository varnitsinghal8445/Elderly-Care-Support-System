import os
from typing import List
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
MAIL_FROM = os.getenv('MAIL_FROM')
MAIL_SENDER_NAME = os.getenv('MAIL_SENDER_NAME', 'ElderCare Notifications')


def send_email(recipients: List[str], subject: str, plain_text: str, html: str | None = None):
    if not SENDGRID_API_KEY or not MAIL_FROM:
        raise RuntimeError('SendGrid not configured: set SENDGRID_API_KEY and MAIL_FROM')

    sg = SendGridAPIClient(SENDGRID_API_KEY)
    from_email = Email(MAIL_FROM, MAIL_SENDER_NAME)

    # Create a single mail with multiple recipients
    to_emails = [To(r) for r in recipients]
    message = Mail(
        from_email=from_email,
        to_emails=to_emails,
        subject=subject,
        plain_text_content=plain_text,
        html_content=html or None,
    )

    response = sg.send(message)
    return response.status_code
