import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ensureDbReady, getDb, persistDbToCloudStorage } from '@/lib/db';
import { getEmailFooterHtml } from '@/lib/email-footer';
import { escapeHtml } from '@/lib/escape-html';
import { ApplicationStatus } from '@/lib/types/types';
import type { ApplicationRecord, ApplicationStatusPayload } from '@/lib/types/apiTypes';

const ALLOWED_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.PENDING,
  ApplicationStatus.DELETED,
]);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const db = getDb();
    const body = (await request.json()) as ApplicationStatusPayload;

    const applicationId = Number.parseInt(String(body.applicationId || '0'), 10);
    const status = String(body.status || '').trim().toLowerCase() as ApplicationStatus;
    const additionalInfo = String(body.additionalInfo || '').trim();

    if (Number.isNaN(applicationId) || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid application ID or status' }, { status: 400 });
    }

    const application = db
      .prepare('SELECT * FROM applications WHERE id = ?')
      .get(applicationId) as ApplicationRecord | undefined;

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const isRestoreFromDeleted =
      application.status === ApplicationStatus.DELETED && status === ApplicationStatus.PENDING;

    if (status === ApplicationStatus.PENDING && !isRestoreFromDeleted && !additionalInfo) {
      return NextResponse.json(
        { error: 'Additional information is required when setting status to pending' },
        { status: 400 }
      );
    }

    // Send email notification if the status is set to 'pending'. Delete does not need to send any email.
    if (status === ApplicationStatus.PENDING && !isRestoreFromDeleted) {
      const emailToSend = process.env.NODE_ENV === 'development' ? process.env.SITE_EMAIL_TO : application.email;
      const safeApplicantName = escapeHtml(application.applicant_name);
      const safePropertyName = escapeHtml(application.property_name);
      const safeAdditionalInfo = escapeHtml(additionalInfo);
      const emailResult = await resend.emails.send({
        from: `${process.env.SITE_NAME} <${process.env.SITE_EMAIL_FROM}>`,
        to: emailToSend || application.email,
        replyTo: process.env.SITE_EMAIL_TO,
        subject: `Application Status Update - ${safePropertyName}`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin: 0;">Phia Rental</h1>
              </div>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin-top: 0;">Application Update</h2>
                <p style="color: #666; margin: 10px 0;">Hi ${safeApplicantName},</p>
                <p style="color: #666; line-height: 1.6;">
                  We have moved your application to the next stage. Your application for <strong>${safePropertyName}</strong> is currently pending.
                </p>
                <div style="background-color: #fff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                  <p style="color: #333; margin: 0; white-space: pre-wrap;">${safeAdditionalInfo}</p>
                </div>
                ${getEmailFooterHtml()}
              </div>
              <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </body>
          </html>
        `,
      });

      if (emailResult.error) {
        console.error('Email send error:', emailResult.error);
        return NextResponse.json({ error: 'Failed to send pending status email' }, { status: 500 });
      }
    }

    const result = db
      .prepare('UPDATE applications SET status = ? WHERE id = ?')
      .run(status, applicationId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    await persistDbToCloudStorage();

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  }
}
