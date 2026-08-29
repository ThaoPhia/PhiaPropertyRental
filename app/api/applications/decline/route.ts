import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ensureDbReady, getDb, persistDbToCloudStorage } from '@/lib/db';
import { buildDeclineEmailHtml } from '@/emails/application-emails';
import { ApplicationStatus } from '@/lib/types/types';
import type { ApplicationDeclinePayload, ApplicationRecord } from '@/lib/types/apiTypes';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const db = getDb();
    const body = (await request.json()) as ApplicationDeclinePayload;

    const applicationId = Number.parseInt(String(body.applicationId || '0'), 10);
    const reason = String(body.reason || '').trim();

    if (Number.isNaN(applicationId) || !reason) {
      return NextResponse.json(
        { error: 'Invalid application ID or reason' },
        { status: 400 }
      );
    }

    // Get application details
    const application = db
      .prepare('SELECT * FROM applications WHERE id = ? AND status != ?')
      .get(applicationId, ApplicationStatus.DELETED) as ApplicationRecord;

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Send decline email (to site email if local, otherwise to applicant)
    const emailToSend = process.env.NODE_ENV === 'development' ? process.env.SITE_EMAIL_TO : application.email;
    
    const emailResult = await resend.emails.send({
      from: `${process.env.SITE_NAME} <${process.env.SITE_EMAIL_FROM}>`,
      to: emailToSend || application.email,
      replyTo: process.env.SITE_EMAIL_TO,
      subject: `Application Status - ${application.property_name}`,
      html: buildDeclineEmailHtml(application, reason),
    });

    if (emailResult.error) {
      console.error('Email send error:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(ApplicationStatus.DECLINED, applicationId);
    await persistDbToCloudStorage();

    return NextResponse.json({
      success: true,
      message: 'Application declined and email sent',
      emailId: emailResult.data?.id,
    });
  } catch (error) {
    console.error('Error declining application:', error);
    return NextResponse.json(
      { error: 'Failed to decline application' },
      { status: 500 }
    );
  }
}
