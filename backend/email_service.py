import resend
from config import settings

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

def send_password_reset_email(to_email: str, reset_link: str):
    if not settings.RESEND_API_KEY:
        print(f"Warning: RESEND_API_KEY not set. Would have sent reset email to {to_email} with link: {reset_link}")
        return False
        
    try:
        r = resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": to_email,
            "subject": "Reset your SmartResume password",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                <h2 style="color: #111;">Password Reset Request</h2>
                <p style="color: #444; font-size: 15px; line-height: 1.5;">
                    We received a request to reset your password. Click the button below to choose a new one:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 13px;">
                    If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
                </p>
            </div>
            """
        })
        print(f"Sent password reset email to {to_email}. Response: {r}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return False
