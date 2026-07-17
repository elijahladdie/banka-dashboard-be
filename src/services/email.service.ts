import nodemailer, { SendMailOptions } from 'nodemailer';
import { Address } from 'nodemailer/lib/mailer';
import { NODE_ENV, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, DASHBOARD_URL } from '../constants/constants';
import logger from '../utils/logger';

function createTransporter(): nodemailer.Transporter {
  const host = SMTP_HOST;
  const port = SMTP_PORT;
  const user = SMTP_USER;
  const pass = SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  if (NODE_ENV !== 'production') {
    logger.warn('[email] SMTP not configured — emails will be logged to console only.');
    return {
      sendMail: async (opts: SendMailOptions) => {
        logger.info('[email] Would send email:', JSON.stringify(opts, null, 2));
        return { messageId: `log-${Date.now()}` };
      },
    } as unknown as nodemailer.Transporter;
  }

  throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in production.');
}

const transporter = createTransporter();

const FROM_ADDRESS: Address = { address: SMTP_FROM || 'noreply@banka.rw', name: 'Banka' };


function buildRegistrationEmailHtml(fullName: string, completionUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Complete Your Banka Registration</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:28px;color:#d4af37;letter-spacing:1px;">BANKA</h1>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a2e;">
                Welcome to Banka, ${fullName}!
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#555;">
                Your payment was successful and your account has been created.
                To start using your dashboard, please set your password and complete your profile.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#d4af37,#b8962f);border-radius:12px;padding:0;">
                    <a href="${completionUrl}"
                       target="_blank"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Complete Your Registration
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#555;">
                This link will expire in 24 hours. If you did not make this purchase,
                please ignore this email.
              </p>

              <hr style="border:none;border-top:1px solid #e8e8ec;margin:24px 0;" />

              <p style="margin:0;font-size:13px;color:#888;">
                Need help? Reply to this email or contact support at
                <a href="mailto:support@banka.rw" style="color:#d4af37;text-decoration:none;">support@banka.rw</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#999;">
                Banka — Modern Digital Banking for Africa<br />
                &copy; ${new Date().getFullYear()} Banka. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type RegistrationEmailOptions = {
  email: string;
  token: string;
  fullName: string;
};
export async function sendRegistrationEmail({
  token,
  fullName, email
}: RegistrationEmailOptions): Promise<void> {
  const dashboardUrl = DASHBOARD_URL;

  const completionUrl = new URL('/auth/signup', dashboardUrl);
  completionUrl.searchParams.set('source', 'paddle');
  completionUrl.searchParams.set('token', token);

  const html = buildRegistrationEmailHtml(fullName, completionUrl.toString());
  const text = [
    `Welcome to Banka, ${fullName}!`,
    '',
    'Your payment was successful and your account has been created.',
    'To start using your dashboard, please complete your registration:',
    '',
    completionUrl.toString(),
    '',
    'This link will expire in 24 hours.',
    '',
    '— Banka Team',
  ].join('\n');

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Complete Your Banka Registration',
    text,
    html,
  });
}

export async function sendEmail(options: SendMailOptions): Promise<void> {
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
export async function sendSubsPlanChangeEmail({
  email,
  firstName,
  previousPlan,
  newPlan,
  isUpgrade,
  previousInterval,
  newInterval,

}: {
  email: string;
  firstName: string;
  previousPlan: string;
  newPlan: string;
  previousInterval: string;
  newInterval: string;
  isUpgrade: boolean;
}): Promise<void> {
  const subject = isUpgrade
    ? 'Your Banka Subscription Has Been Upgraded'
    : 'Your Banka Subscription Has Been Downgraded';

  const billingNote =
    'Since you changed plans during an active billing cycle, any prorated credits or charges have been applied automatically. Future renewals will be billed at the standard rate of your new plan.';

  const text = isUpgrade
    ? `Hi ${firstName},

Great news! Your subscription has been successfully upgraded from ${previousPlan} - ${previousInterval} to ${newPlan} - ${newInterval}.

You now have immediate access to all features included in your new plan.

Billing update: ${billingNote}

Thank you for choosing Banka.

— The Banka Team`
    : `Hi ${firstName},

Your subscription has been changed from ${previousPlan} - ${previousInterval} to ${newPlan} - ${newInterval}.

Your account has been successfully downgraded and your new plan is now active.

Billing update: ${billingNote}

Thank you for choosing Banka.

— The Banka Team`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333;">
      <p>Hi ${firstName},</p>

      ${isUpgrade
      ? `
            <p>
              Great news! Your subscription has been successfully upgraded from
              <strong>${previousPlan}</strong> to
              <strong>${newPlan}</strong>.
            </p>

            <p>
              You now have immediate access to all features included in your new plan.
            </p>
          `
      : `
            <p>
              Your subscription has been changed from
              <strong>${previousPlan} - ${previousInterval}</strong> to
              <strong>${newPlan} - ${newInterval}</strong>.
            </p>

            <p>
              Your account has been successfully downgraded and your new plan is now active.
            </p>
          `
    }

      <div
        style="
          margin: 24px 0;
          padding: 16px;
          background-color: #f8f9fa;
          border-left: 4px solid #d4af37;
          border-radius: 4px;
        "
      >
        <strong>Billing Update</strong>
        <p style="margin: 8px 0 0;">
          Since you changed plans during an active billing cycle, any prorated
          credits or charges have been applied automatically. Future renewals
          will be billed at the standard rate of your new plan.
        </p>
      </div>

      <p>Thank you for choosing Banka.</p>

      <p>
        Best regards,<br />
        <strong>The Banka Team</strong>
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

