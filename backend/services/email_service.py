import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger(__name__)


def send_email(
    smtp_email: str,
    smtp_app_password: str,
    to: str,
    name: str,
    pwd: str,
) -> bool:
    """
    Send onboarding credentials to a newly created user.
    Returns True on success, False on failure.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Reimbursement Portal Credentials"
        msg["From"]    = smtp_email
        msg["To"]      = to

        plain = (
            f"Hi {name},\n\n"
            f"Your Reimbursement Portal account has been created.\n\n"
            f"  Email   : {to}\n"
            f"  Password: {pwd}\n\n"
            f"Please log in and change your password immediately.\n\n"
            f"Regards,\nReimbursement Portal"
        )

        html = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;max-width:520px;margin:auto">
            <h2 style="color:#4F46E5">Reimbursement Portal</h2>
            <p>Hi <strong>{name}</strong>,</p>
            <p>Your account has been created. Here are your login credentials:</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold;width:120px">Email</td>
                <td style="padding:8px 12px;background:#F9FAFB">{to}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold">Password</td>
                <td style="padding:8px 12px;background:#F9FAFB">{pwd}</td>
              </tr>
            </table>
            <p style="color:#DC2626;font-weight:bold">
              ⚠️ Please change your password immediately after your first login.
            </p>
            <p style="font-size:13px;color:#6B7280;margin-top:32px">
              This is an automated message. Do not reply to this email.
            </p>
          </body>
        </html>
        """

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html,  "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(smtp_email, smtp_app_password)
            server.send_message(msg)

        logger.info("Credentials email sent to %s", to)
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed for sender %s", smtp_email)
    except smtplib.SMTPRecipientsRefused:
        logger.error("Recipient refused: %s", to)
    except smtplib.SMTPException as exc:
        logger.error("SMTP error sending to %s: %s", to, exc)
    except Exception as exc:
        logger.error("Unexpected error sending email to %s: %s", to, exc)

    return False


def send_approval_notification(
    smtp_email: str,
    smtp_app_password: str,
    to: str,
    approver_name: str,
    employee_name: str,
    expense_id: int,
    amount: float,
    currency: str,
    category: str,
    portal_url: Optional[str] = None,
) -> bool:
    """
    Notify an approver that a new expense is waiting for their review.
    Returns True on success, False on failure.
    """
    try:
        review_link = (
            f'<a href="{portal_url}/approvals/{expense_id}">Review Expense</a>'
            if portal_url
            else f"Expense #{expense_id}"
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Action Required: Expense #{expense_id} awaits your approval"
        msg["From"]    = smtp_email
        msg["To"]      = to

        plain = (
            f"Hi {approver_name},\n\n"
            f"An expense submitted by {employee_name} requires your approval.\n\n"
            f"  Expense ID : #{expense_id}\n"
            f"  Amount     : {currency} {amount:,.2f}\n"
            f"  Category   : {category}\n\n"
            f"Please log in to the portal to review it.\n\n"
            f"Regards,\nReimbursement Portal"
        )

        html = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;max-width:520px;margin:auto">
            <h2 style="color:#4F46E5">Reimbursement Portal</h2>
            <p>Hi <strong>{approver_name}</strong>,</p>
            <p>
              An expense submitted by <strong>{employee_name}</strong>
              is waiting for your approval.
            </p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold;width:130px">Expense&nbsp;ID</td>
                <td style="padding:8px 12px;background:#F9FAFB">#{expense_id}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold">Amount</td>
                <td style="padding:8px 12px;background:#F9FAFB">{currency} {amount:,.2f}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold">Category</td>
                <td style="padding:8px 12px;background:#F9FAFB">{category}</td>
              </tr>
            </table>
            <p>{review_link}</p>
            <p style="font-size:13px;color:#6B7280;margin-top:32px">
              This is an automated message. Do not reply to this email.
            </p>
          </body>
        </html>
        """

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html,  "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(smtp_email, smtp_app_password)
            server.send_message(msg)

        logger.info("Approval notification sent to %s for expense #%d", to, expense_id)
        return True

    except Exception as exc:
        logger.error("Error sending approval notification to %s: %s", to, exc)
        return False


def send_status_notification(
    smtp_email: str,
    smtp_app_password: str,
    to: str,
    employee_name: str,
    expense_id: int,
    amount: float,
    currency: str,
    status: str,          # "approved" | "rejected"
    comment: Optional[str] = None,
    portal_url: Optional[str] = None,
) -> bool:
    """
    Notify an employee that their expense was approved or rejected.
    Returns True on success, False on failure.
    """
    try:
        is_approved  = status.lower() == "approved"
        status_label = "Approved ✅" if is_approved else "Rejected ❌"
        status_color = "#16A34A"    if is_approved else "#DC2626"
        subject      = (
            f"Your expense #{expense_id} has been {status.lower()}"
        )

        detail_link = (
            f'<a href="{portal_url}/expenses/{expense_id}">View Expense</a>'
            if portal_url
            else f"Expense #{expense_id}"
        )

        comment_row = (
            f"""
            <tr>
              <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold;width:130px">Comment</td>
              <td style="padding:8px 12px;background:#F9FAFB">{comment}</td>
            </tr>
            """
            if comment
            else ""
        )

        plain_comment = f"\n  Comment    : {comment}" if comment else ""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_email
        msg["To"]      = to

        plain = (
            f"Hi {employee_name},\n\n"
            f"Your expense has been {status.lower()}.\n\n"
            f"  Expense ID : #{expense_id}\n"
            f"  Amount     : {currency} {amount:,.2f}\n"
            f"  Status     : {status.upper()}"
            f"{plain_comment}\n\n"
            f"Regards,\nReimbursement Portal"
        )

        html = f"""
        <html>
          <body style="font-family:Arial,sans-serif;color:#333;max-width:520px;margin:auto">
            <h2 style="color:#4F46E5">Reimbursement Portal</h2>
            <p>Hi <strong>{employee_name}</strong>,</p>
            <p>Your expense has been reviewed.</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold;width:130px">Expense&nbsp;ID</td>
                <td style="padding:8px 12px;background:#F9FAFB">#{expense_id}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold">Amount</td>
                <td style="padding:8px 12px;background:#F9FAFB">{currency} {amount:,.2f}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#F3F4F6;font-weight:bold">Status</td>
                <td style="padding:8px 12px;background:#F9FAFB;color:{status_color};font-weight:bold">{status_label}</td>
              </tr>
              {comment_row}
            </table>
            <p>{detail_link}</p>
            <p style="font-size:13px;color:#6B7280;margin-top:32px">
              This is an automated message. Do not reply to this email.
            </p>
          </body>
        </html>
        """

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html,  "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(smtp_email, smtp_app_password)
            server.send_message(msg)

        logger.info("Status notification (%s) sent to %s for expense #%d", status, to, expense_id)
        return True

    except Exception as exc:
        logger.error("Error sending status notification to %s: %s", to, exc)
        return False