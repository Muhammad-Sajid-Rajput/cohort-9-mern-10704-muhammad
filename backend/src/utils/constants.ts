type ExpiryOptions = {
  days?: number;
  minutes?: number;
};

export const getExpiryInMs = ({
  days = 0,
  minutes = 0,
}: ExpiryOptions): number => {
  return days * 24 * 60 * 60 * 1000 + minutes * 60 * 1000;
};

export const isExpired = (date: Date) => Date.now() > date.getTime();

export const HTML_VERIFY_EMAIL = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Verify Your Email</title></head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:20px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
          <tr><td align="center" style="font-size:24px;font-weight:bold;color:#333;">Verify Your Email</td></tr>
          <tr><td height="20"></td></tr>
          <tr><td style="font-size:16px;color:#555;line-height:1.5;">Thanks for signing up. Please confirm your email address by clicking the button below.</td></tr>
          <tr><td height="30"></td></tr>
          <tr><td align="center">
            <a href="{{VERIFY_URL}}" style="background-color:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;font-size:16px;font-weight:bold;">
              Verify Email — expires in 10 minutes
            </a>
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:14px;color:#888;">If the button doesn't work, copy and paste this link:<br/><br/>
            <a href="{{VERIFY_URL}}" style="color:#4f46e5;word-break:break-all;">{{VERIFY_URL}}</a>
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:12px;color:#aaa;text-align:center;">If you didn't create an account, you can safely ignore this email.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export const HTML_FORGOT_PASSWORD = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Reset Your Password</title></head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:20px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
          <tr><td align="center" style="font-size:24px;font-weight:bold;color:#333;">Reset Your Password</td></tr>
          <tr><td height="20"></td></tr>
          <tr><td style="font-size:16px;color:#555;line-height:1.5;">We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>10 minutes</strong>.</td></tr>
          <tr><td height="30"></td></tr>
          <tr><td align="center">
            <a href="{{RESET_URL}}" style="background-color:#e53e3e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;font-size:16px;font-weight:bold;">
              Reset Password
            </a>
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:14px;color:#888;">If the button doesn't work, copy and paste this link:<br/><br/>
            <a href="{{RESET_URL}}" style="color:#e53e3e;word-break:break-all;">{{RESET_URL}}</a>
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:12px;color:#aaa;text-align:center;">If you didn't request a password reset, you can safely ignore this email.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export const HTML_PASSWORD_RESET_SUCCESS = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Password Reset Successful</title></head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:20px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
          <tr><td align="center" style="font-size:40px;"></td></tr>
          <tr><td height="10"></td></tr>
          <tr><td align="center" style="font-size:24px;font-weight:bold;color:#333;">Password Reset Successful</td></tr>
          <tr><td height="20"></td></tr>
          <tr><td style="font-size:16px;color:#555;line-height:1.5;">
            Hi <strong>{{USERNAME}}</strong>, your password has been successfully reset.
            You can now log in with your new password.
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:14px;color:#e53e3e;line-height:1.5;">
            ⚠️ If you did not make this change, please contact us immediately and secure your account.
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:12px;color:#aaa;text-align:center;">This is an automated security notification from Notes App.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export const HTML_NEW_LOGIN = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>New Login Detected</title></head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:20px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
          <tr><td align="center" style="font-size:40px;"></td></tr>
          <tr><td height="10"></td></tr>
          <tr><td align="center" style="font-size:24px;font-weight:bold;color:#333;">New Login Detected</td></tr>
          <tr><td height="20"></td></tr>
          <tr><td style="font-size:16px;color:#555;line-height:1.5;">
            Hi <strong>{{USERNAME}}</strong>, we noticed a new login to your account.
          </td></tr>
          <tr><td height="20"></td></tr>
          <tr><td>
            <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9f9f9;border-radius:6px;font-size:14px;color:#555;">
              <tr><td><strong>Time:</strong></td><td>{{LOGIN_TIME}}</td></tr>
              <tr><td><strong> Location:</strong></td><td>{{LOGIN_LOCATION}}</td></tr>
              <tr><td><strong> Device:</strong></td><td>{{LOGIN_DEVICE}}</td></tr>
            </table>
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:14px;color:#e53e3e;line-height:1.5;">
            ⚠️ If this wasn't you, please reset your password immediately.
          </td></tr>
          <tr><td height="20"></td></tr>
          <tr><td align="center">
            <a href="{{RESET_URL}}" style="background-color:#e53e3e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;font-size:14px;font-weight:bold;">
              Secure My Account
            </a>
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:12px;color:#aaa;text-align:center;">This is an automated security notification from Notes App.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export const HTML_ACCOUNT_VERIFIED = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Account Verified</title></head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:20px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
          <tr><td align="center" style="font-size:40px;">🎉</td></tr>
          <tr><td height="10"></td></tr>
          <tr><td align="center" style="font-size:24px;font-weight:bold;color:#333;">Account Verified!</td></tr>
          <tr><td height="20"></td></tr>
          <tr><td style="font-size:16px;color:#555;line-height:1.5;">
            Hi <strong>{{USERNAME}}</strong>, your email has been successfully verified.
            Welcome to Notes App — you're all set to start using your account.
          </td></tr>
          <tr><td height="30"></td></tr>
          <tr><td style="font-size:12px;color:#aaa;text-align:center;">Thanks for joining Notes App.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
