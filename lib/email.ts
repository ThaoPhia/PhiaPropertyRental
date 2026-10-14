import { Resend } from 'resend';

interface EmailMessage {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
}

export async function sendEmail(message: EmailMessage) {
  const mailpitUrl = process.env.MAILPIT_URL;
  if (!mailpitUrl) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({
      from: `${process.env.SITE_NAME} <${process.env.SITE_EMAIL_FROM}>`,
      ...message,
    });
  }

  if (process.env.NODE_ENV !== 'development') {
    throw new Error('MAILPIT_URL is only supported in development. Unset it to use Resend.');
  }
  if (!process.env.SITE_EMAIL_FROM) {
    throw new Error('SITE_EMAIL_FROM is required to send email.');
  }

  const response = await fetch(`${mailpitUrl.replace(/\/$/, '')}/api/v1/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      From: { Email: process.env.SITE_EMAIL_FROM, Name: process.env.SITE_NAME },
      To: [{ Email: message.to }],
      ReplyTo: message.replyTo ? [{ Email: message.replyTo }] : undefined,
      Subject: message.subject,
      HTML: message.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mailpit email send failed (HTTP ${response.status}).`);
  }
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('ID' in result) ||
      typeof result.ID !== 'string' || !result.ID) {
    throw new Error('Mailpit returned an invalid email ID.');
  }
  return { data: { id: result.ID }, error: null };
}
