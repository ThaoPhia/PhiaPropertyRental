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

    // Send approval email (to site email if local, otherwise to applicant)
    const emailToSend = process.env.NODE_ENV === 'development' ? process.env.SITE_EMAIL_TO : application.email;

    const emailResult = await resend.emails.send({
      from: `${process.env.SITE_NAME} <${process.env.SITE_EMAIL_FROM}>`,
      to: emailToSend || application.email,
      subject: `Application Status - ${application.property_name}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">Phia Rental</h1>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
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

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('approved', applicationId);

    return NextResponse.json({
      success: true,
      message: 'Application approved and email sent',
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
