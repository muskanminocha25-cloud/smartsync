import resend
from ..config import settings


def send_password_reset_email(
    to_email: str,
    user_name: str,
    reset_token: str,
) -> bool:
    """
    Sends a password reset email using Resend.
    Returns True if sent successfully, False otherwise.
    """
    reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, sans-serif; background: #0a0a1a; color: #ffffff; padding: 40px;">
        <div style="max-width: 560px; margin: 0 auto; background: #1a1a3e; border-radius: 16px; padding: 40px; border: 1px solid #2d2d6b;">
            <h1 style="color: #6366f1; margin-bottom: 8px;">SmartSync</h1>
            <p style="color: #a0a0c8; margin-bottom: 32px;">Semantic Placement Analytics</p>

            <h2 style="margin-bottom: 16px;">Reset Your Password</h2>
            <p style="color: #c0c0e0; line-height: 1.6;">
                Hi {user_name},<br><br>
                You asked to reset your SmartSync password. Click the button below —
                this link will expire in <strong>1 hour</strong>.
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_url}"
                   style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
                          padding: 14px 32px; border-radius: 10px; text-decoration: none;
                          font-weight: 600; font-size: 16px;">
                    Reset My Password
                </a>
            </div>

            <p style="color: #6060a0; font-size: 13px; border-top: 1px solid #2d2d6b; padding-top: 20px;">
                If you didn't request this, just ignore this email. Your password won't change.
                <br><br>
                Or paste this link in your browser:<br>
                <a href="{reset_url}" style="color: #6366f1;">{reset_url}</a>
            </p>
        </div>
    </body>
    </html>
    """

    try:
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": settings.from_email,
            "to": to_email,
            "subject": "Reset your SmartSync password",
            "html": html_content,
        })
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send reset email: {e}")
        return False