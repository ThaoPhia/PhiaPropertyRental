import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/escape-html';
import { verifyRecaptchaToken } from '@/lib/recaptcha-server';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactPayload {
  name: unknown;
  email: unknown;
  phone: unknown;
  comments: unknown;
  recaptchaToken: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactPayload;

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const comments = String(body.comments || '').trim();
    const recaptchaToken = String(body.recaptchaToken || '').trim();

    if (!name || !email || !phone || !comments || !recaptchaToken) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const remoteIpHeader = request.headers.get('x-forwarded-for');
    const remoteIp = remoteIpHeader ? remoteIpHeader.split(',')[0].trim() : null;

    try {
      const recaptchaValid = await verifyRecaptchaToken({
        token: recaptchaToken,
        remoteIp,
        expectedAction: 'contact',
      });

      if (!recaptchaValid) {
        return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'reCAPTCHA verification failed' },
        { status: 503 }
      );
    }

    const recipient = process.env.SITE_EMAIL_TO || process.env.SITE_EMAIL_FROM;
    if (!recipient) {
      return NextResponse.json({ error: 'Site email is not configured' }, { status: 500 });
    }

    const emailResult = await resend.emails.send({
      from: `${process.env.SITE_NAME} <${process.env.SITE_EMAIL_FROM}>`,
      to: recipient,
      replyTo: `${process.env.SITE_EMAIL_TO}`,
      subject: `Contact Form Submission - ${name}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1f2937; margin-bottom: 16px;">New Contact Request</h1>
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px; color: #111827;"><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p style="margin: 0 0 8px; color: #111827;"><strong>Email:</strong> ${escapeHtml(email)}</p>
              <p style="margin: 0 0 8px; color: #111827;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
              <p style="margin: 12px 0 4px; color: #111827;"><strong>Comments:</strong></p>
              <p style="margin: 0; color: #111827; white-space: pre-wrap;">${escapeHtml(comments)}</p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailResult.error) {
      console.error('Contact email send error:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send contact request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending contact request:', error);
    return NextResponse.json({ error: 'Failed to send contact request' }, { status: 500 });
  }
}
