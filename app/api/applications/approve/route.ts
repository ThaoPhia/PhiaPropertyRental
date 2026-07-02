import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import db from '@/lib/db';
import { getEmailFooterHtml } from '@/lib/email-footer';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Application {
  id: number;
  email: string;
  applicant_name: string;
  property_id: number;
  property_name: string;
  status?: string;
}

interface DeclinedApplicantNotificationTarget {
  id: number;
  email: string;
  applicant_name: string;
  property_name: string;
}

function resolveRecipientEmail(email: string): string {
  return process.env.NODE_ENV === 'development' ? process.env.SITE_EMAIL_TO || email : email;
}

function buildEmailHtml(content: string): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Phia Rental</h1>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          ${content}
          ${getEmailFooterHtml()}
        </div>

        <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;
}

function buildApprovalEmailHtml(application: Application): string {
  return buildEmailHtml(`
    <h2 style="color: #333; margin-top: 0;">Application Approved!</h2>
    <p style="color: #666; margin: 10px 0;">Hi ${application.applicant_name},</p>

    <p style="color: #666; line-height: 1.6;">
      Congratulations! Your rental application for <strong>${application.property_name}</strong> has been approved.
    </p>

    <div style="background-color: #fff; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <p style="color: #333; margin: 0; font-weight: 500;">We're excited to have you as our tenant!</p>
    </div>

    <p style="color: #666; line-height: 1.6;">
      Our team will be in touch shortly with next steps and move-in details.
      If you have any questions in the meantime, please don't hesitate to reach out to us.
    </p>
  `);
}

function buildDeclinedNotificationEmailHtml(applicant: DeclinedApplicantNotificationTarget): string {
  return buildEmailHtml(`
    <h2 style="color: #333; margin-top: 0;">Application Decision</h2>
    <p style="color: #666; margin: 10px 0;">Hi ${applicant.applicant_name},</p>

    <p style="color: #666; line-height: 1.6;">
      Thank you for your interest in <strong>${applicant.property_name}</strong>.
      At this time, we decided to move forward with another applicant for this property. Best wishes in your search for a new home!
    </p>
  `);
}

function getApplicationById(applicationId: number): Application | undefined {
  return db
    .prepare('SELECT * FROM applications WHERE id = ? AND status != ?')
    .get(applicationId, 'deleted') as Application | undefined;
}

function getRecentlyDeclinedApplicants(propertyId: number, approvedApplicationId: number): DeclinedApplicantNotificationTarget[] {
  return db.prepare(`
    SELECT id, email, applicant_name, property_name
    FROM applications
    WHERE property_id = ? AND id != ? AND status NOT IN ('deleted', 'declined', 'approved', 'approve-archived')
  `).all(propertyId, approvedApplicationId) as DeclinedApplicantNotificationTarget[];
}

function updateApplicationStatuses(propertyId: number, approvedApplicationId: number): void {
  // Set declined for all other applications for the same property that are not already deleted, declined, or approved
  db.prepare(`
    UPDATE applications
    SET status = 'declined'
    WHERE property_id = ? AND id != ? AND status NOT IN ('deleted', 'declined', 'approved', 'approve-archived')
  `).run(propertyId, approvedApplicationId);

  // Set old approved applicant to approve-archived
  db.prepare('UPDATE applications SET status = ? WHERE property_id = ? AND status = ? AND id != ?')
      .run('approve-archived', propertyId, 'approved', approvedApplicationId);
  // Now set the new applicant as approved
  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('approved', approvedApplicationId);
}

async function sendApplicationStatusEmail(email: string, propertyName: string, html: string) {
  return resend.emails.send({
    from: `${process.env.SITE_NAME} <${process.env.SITE_EMAIL_FROM}>`,
    to: resolveRecipientEmail(email),
    subject: `Application Status - ${propertyName}`,
    html,
  });
}

export async function POST(request: NextRequest) {
  try {
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

    const recentlyDeclinedApplicants = getRecentlyDeclinedApplicants(application.property_id, applicationId);
    updateApplicationStatuses(application.property_id, applicationId);

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
