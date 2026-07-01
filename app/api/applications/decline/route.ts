import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import db from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Application {
  id: number;
  email: string;
  applicant_name: string;
  property_name: string;
  status?: string;
}

interface DeclinePayload {
  applicationId: unknown;
  reason: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DeclinePayload;

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
      .get(applicationId, 'deleted') as Application;

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Send decline email (to site email if local, otherwise to applicant)
    const emailToSend = process.env.NODE_ENV === 'development' ? process.env.SITE_EMAIL : application.email;
    
    const emailResult = await resend.emails.send({
      // TODO: Replace from email with a valid Resend email or the site email. Need this for now for it to send emails.
      from: `${process.env.SITE_NAME} <onboarding@resend.dev>`,
      to: emailToSend || application.email,
      subject: `Application Status - ${application.property_name}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">Phia Rental</h1>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Application Decision</h2>
              <p style="color: #666; margin: 10px 0;">Hi ${application.applicant_name},</p>
              
              <p style="color: #666; line-height: 1.6;">
                Thank you for submitting your rental application for <strong>${application.property_name}</strong>. 
                We appreciate your interest in our property.
              </p>

              <p style="color: #666; line-height: 1.6;">
                Unfortunately, after careful review, we have decided not to move forward with your application at this time for the following reason:
              </p>

              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <p style="color: #333; margin: 0; font-weight: 500;">${reason}</p>
              </div>

              <p style="color: #666; line-height: 1.6;">
                We encourage you to apply for other properties that may be a better fit for your situation. 
                If you have any questions, please don't hesitate to reach out to us.
              </p>

              <p style="color: #666; margin: 20px 0 0 0;">
                Best regards,<br>
                <strong>The Phia Rental Team</strong>
              </p>
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
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('declined', applicationId);

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
