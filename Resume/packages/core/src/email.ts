import { Resend } from "resend";

// Lazily initialised so the module can be imported without crashing when
// RESEND_API_KEY is not yet set (e.g. during local dev without email).
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key)
      throw new Error("RESEND_API_KEY is not set in environment variables.");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "CareerAI <noreply@careerai.app>";

// ─── Email helpers ────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  url: string,
) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your CareerAI email",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#09090b;color:#fff;padding:32px;border-radius:12px;border:1px solid #27272a">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
          <div style="background:#fff;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center">
            <span style="font-size:14px;">⚡</span>
          </div>
          <span style="font-weight:700;font-size:18px;letter-spacing:-0.5px">CareerAI</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Verify your email</h2>
        <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Hi ${name}, click the button below to verify your email address.</p>
        <a href="${url}" style="display:inline-block;background:#fff;color:#000;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;text-decoration:none;margin-bottom:24px">
          Verify Email →
        </a>
        <p style="color:#52525b;font-size:12px;margin:0">If you didn't create a CareerAI account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  url: string,
) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your CareerAI password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#09090b;color:#fff;padding:32px;border-radius:12px;border:1px solid #27272a">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
          <div style="background:#fff;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center">
            <span style="font-size:14px;">⚡</span>
          </div>
          <span style="font-weight:700;font-size:18px;letter-spacing:-0.5px">CareerAI</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Reset your password</h2>
        <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Hi ${name}, we received a request to reset your password. Click below — this link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;background:#fff;color:#000;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;text-decoration:none;margin-bottom:24px">
          Reset Password →
        </a>
        <p style="color:#52525b;font-size:12px;margin:0">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to CareerAI — let's land your dream role 🚀",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#09090b;color:#fff;padding:32px;border-radius:12px;border:1px solid #27272a">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
          <div style="background:#fff;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center">
            <span style="font-size:14px;">⚡</span>
          </div>
          <span style="font-weight:700;font-size:18px;letter-spacing:-0.5px">CareerAI</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Welcome, ${name}! 🎉</h2>
        <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Your account is ready. Upload your first resume to get a full AI analysis, job matches, and a personalised career roadmap.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/resume" style="display:inline-block;background:#fff;color:#000;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;text-decoration:none;margin-bottom:24px">
          Upload your resume →
        </a>
        <p style="color:#52525b;font-size:12px;margin:0">Questions? Just reply to this email. We're here to help.</p>
      </div>
    `,
  });
}

export async function sendSubscriptionSuccessEmail(to: string, name: string, plan: string) {
  const resend = getResend();
  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're now on the ${plan} Plan! ⚡`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#09090b;color:#fff;padding:32px;border-radius:12px;border:1px solid #27272a">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
          <div style="background:#fff;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center">
            <span style="font-size:14px;">⚡</span>
          </div>
          <span style="font-weight:700;font-size:18px;letter-spacing:-0.5px">CareerAI</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Thank you for upgrading! 🎉</h2>
        <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Hi ${name}, your account has been upgraded to the <strong>${plan}</strong> plan. You now have expanded access to all AI career tools.</p>
        <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#a1a1aa">Plan: <span style="color:#fff">${plan}</span></p>
          <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa">Status: <span style="color:#10b981">Active</span></p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;background:#fff;color:#000;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;text-decoration:none;margin-bottom:24px">
          Go to Dashboard →
        </a>
      </div>
    `,
  });
}
