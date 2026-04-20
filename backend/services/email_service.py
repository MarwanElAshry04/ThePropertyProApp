import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from config import settings
from database.postgres import get_db_cursor



def generate_code() -> str:
    """Generate a random 6-digit numeric code."""
    return ''.join(random.choices(string.digits, k=6))



def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an email via Gmail SMTP.
    Returns True if sent successfully, False otherwise.
    """
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = f"PropertyPro <{settings.EMAIL_ADDRESS}>"
        msg['To']      = to_email

        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_ADDRESS, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Email send failed: {e}")
        return False



def verification_email_template(code: str, full_name: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9f8ff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1A1265; font-size: 24px; margin: 0;">PropertyPro</h1>
            <p style="color: #C9A84C; font-size: 12px; letter-spacing: 2px; margin: 4px 0 0;">AI-POWERED REAL ESTATE</p>
        </div>

        <h2 style="color: #1A1265; font-size: 20px;">Verify your email</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Hi {full_name}, enter this code in the app to verify your email address:
        </p>

        <div style="background: #1A1265; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #C9A84C; font-size: 11px; letter-spacing: 2px; margin: 0 0 8px;">YOUR VERIFICATION CODE</p>
            <p style="color: #ffffff; font-size: 40px; font-weight: bold; letter-spacing: 12px; margin: 0;">{code}</p>
        </div>

        <p style="color: #888; font-size: 13px;">This code expires in <strong>15 minutes</strong>.</p>
        <p style="color: #888; font-size: 13px;">If you didn't create a PropertyPro account, ignore this email.</p>
    </div>
    """


def reset_password_email_template(code: str, full_name: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9f8ff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1A1265; font-size: 24px; margin: 0;">PropertyPro</h1>
            <p style="color: #C9A84C; font-size: 12px; letter-spacing: 2px; margin: 4px 0 0;">AI-POWERED REAL ESTATE</p>
        </div>

        <h2 style="color: #1A1265; font-size: 20px;">Reset your password</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Hi {full_name}, enter this code in the app to reset your password:
        </p>

        <div style="background: #1A1265; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #C9A84C; font-size: 11px; letter-spacing: 2px; margin: 0 0 8px;">YOUR RESET CODE</p>
            <p style="color: #ffffff; font-size: 40px; font-weight: bold; letter-spacing: 12px; margin: 0;">{code}</p>
        </div>

        <p style="color: #888; font-size: 13px;">This code expires in <strong>15 minutes</strong>.</p>
        <p style="color: #888; font-size: 13px;">If you didn't request a password reset, ignore this email.</p>
    </div>
    """



def store_verification_code(user_id: int, email: str, code: str, code_type: str):
    """
    Store a verification code in the database.
    Deletes any existing unused codes of the same type first.
    """
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    with get_db_cursor() as cursor:
        # Delete old unused codes of same type for this email
        cursor.execute("""
            DELETE FROM verification_codes
            WHERE email = %s AND type = %s AND used = FALSE
        """, (email, code_type))

        # Insert new code
        cursor.execute("""
            INSERT INTO verification_codes (user_id, email, code, type, expires_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, email, code, code_type, expires_at))


def verify_code(email: str, code: str, code_type: str) -> bool:
    """
    Verify a code against the database.
    Marks it as used if valid.
    Returns True if valid, False if invalid or expired.
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT id FROM verification_codes
            WHERE email = %s
              AND code = %s
              AND type = %s
              AND used = FALSE
              AND expires_at > %s
        """, (email, code, code_type, datetime.utcnow()))

        row = cursor.fetchone()

        if not row:
            return False

        # Mark as used so it can't be reused
        cursor.execute(
            "UPDATE verification_codes SET used = TRUE WHERE id = %s",
            (row["id"],)
        )
        return True



def send_verification_email(user_id: int, email: str, full_name: str) -> bool:
    """Generate code, store it, and send verification email."""
    code = generate_code()
    store_verification_code(user_id, email, code, 'verify_email')
    return send_email(
        to_email=  email,
        subject=   "Your PropertyPro verification code",
        html_body= verification_email_template(code, full_name),
    )


def send_password_reset_email(user_id: int, email: str, full_name: str) -> bool:
    """Generate code, store it, and send password reset email."""
    code = generate_code()
    store_verification_code(user_id, email, code, 'reset_password')
    return send_email(
        to_email=  email,
        subject=   "Your PropertyPro password reset code",
        html_body= reset_password_email_template(code, full_name),
    )