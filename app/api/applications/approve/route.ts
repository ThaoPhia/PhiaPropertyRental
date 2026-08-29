import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady, persistDbToCloudStorage } from '@/lib/db';
import { buildApprovalEmailHtml, buildDeclinedNotificationEmailHtml } from '@/emails/application-emails';
import {
  getApplicationById,
  getRecentlyDeclinedApplicants,
  sendApplicationStatusEmail,
  updateApplicationStatuses,
} from '@/lib/api/application-helpers';

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = (await request.json()) as { applicationId: unknown };

    const applicationId = Number.parseInt(String(body.applicationId || '0'), 10);

    if (Number.isNaN(applicationId)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    const application = getApplicationById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const emailResult = await sendApplicationStatusEmail(
      application.email,
      application.property_name,
      buildApprovalEmailHtml(application)
    );

    if (emailResult.error) {
      console.error('Email send error:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    const propertyId = application.property_id;
    if (typeof propertyId !== 'number') {
      return NextResponse.json(
        { error: 'Application property is invalid' },
        { status: 500 }
      );
    }

    const recentlyDeclinedApplicants = getRecentlyDeclinedApplicants(propertyId, applicationId);
    updateApplicationStatuses(propertyId, applicationId);
    await persistDbToCloudStorage();

    for (const declinedApplicant of recentlyDeclinedApplicants) {
      const declinedEmailResult = await sendApplicationStatusEmail(
        declinedApplicant.email,
        declinedApplicant.property_name,
        buildDeclinedNotificationEmailHtml(declinedApplicant)
      );

      if (declinedEmailResult.error) {
        console.error('Declined applicant email send error:', declinedEmailResult.error);
        return NextResponse.json(
          { error: 'Failed to send decline notification email(s)' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application approved and email sent. Remaining applicants have been declined and notified of the decision.',
      emailId: emailResult.data?.id,
    });
  } catch (error) {
    console.error('Error approving application:', error);
    return NextResponse.json(
      { error: 'Failed to approve application' },
      { status: 500 }
    );
  }
}
