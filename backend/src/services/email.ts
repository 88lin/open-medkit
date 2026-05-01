import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export interface SmtpConfig {
  provider: 'smtp';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
  verifiedAt?: string;
  lastTestAt?: string;
}

export interface ResendConfig {
  provider: 'resend';
  apiKey: string;
  from: string;
  to: string;
  verifiedAt?: string;
  lastTestAt?: string;
}

export type EmailConfig = SmtpConfig | ResendConfig;

// ---------------------------------------------------------------------------
// SMTP
// ---------------------------------------------------------------------------

function createTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
}

async function sendSmtp(
  config: SmtpConfig,
  subject: string,
  html: string,
): Promise<void> {
  const transporter = createTransport(config);
  await transporter.sendMail({ from: config.from, to: config.to, subject, html });
}

async function verifySmtp(config: SmtpConfig): Promise<void> {
  const transporter = createTransport(config);
  await transporter.verify();
}

// ---------------------------------------------------------------------------
// Resend
// ---------------------------------------------------------------------------

const RESEND_API = 'https://api.resend.com/emails';

async function sendResend(
  config: ResendConfig,
  subject: string,
  html: string,
): Promise<void> {
  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Unified interface
// ---------------------------------------------------------------------------

export async function sendEmail(
  config: EmailConfig,
  subject: string,
  html: string,
): Promise<void> {
  if (config.provider === 'smtp') {
    await sendSmtp(config, subject, html);
  } else {
    await sendResend(config, subject, html);
  }
}

/**
 * Verify that the email config is usable.
 *
 * - SMTP: calls transporter.verify() to check connection/auth.
 * - Resend: sends a real test email (the only reliable way to validate
 *   API key + from address + sending permission at once).
 */
export async function verifyEmail(config: EmailConfig): Promise<void> {
  if (config.provider === 'smtp') {
    await verifySmtp(config);
  } else {
    await sendResend(
      config,
      'MedKit 邮件连通性测试',
      '<p>这是一封来自 <b>OpenMedKit</b> 的测试邮件，收到即表示配置正确。</p>',
    );
  }
}
