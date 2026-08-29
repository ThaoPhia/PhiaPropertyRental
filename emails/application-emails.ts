import { getEmailFooterHtml } from '@/lib/email-footer';
import { escapeHtml } from '@/lib/escape-html';
import type { ApplicationRecord, DeclinedApplicantNotificationTarget } from '@/lib/types/apiTypes';

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

export function buildApprovalEmailHtml(application: ApplicationRecord): string {
  const applicantName = escapeHtml(application.applicant_name);
  const propertyName = escapeHtml(application.property_name);

  return buildEmailHtml(`
    <h2 style="color: #333; margin-top: 0;">Application Approved!</h2>
    <p style="color: #666; margin: 10px 0;">Hi ${applicantName},</p>

    <p style="color: #666; line-height: 1.6;">
      Congratulations! Your rental application for <strong>${propertyName}</strong> has been approved.
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

export function buildDeclinedNotificationEmailHtml(
  applicant: DeclinedApplicantNotificationTarget
): string {
  const applicantName = escapeHtml(applicant.applicant_name);
  const propertyName = escapeHtml(applicant.property_name);

  return buildEmailHtml(`
    <h2 style="color: #333; margin-top: 0;">Application Decision</h2>
    <p style="color: #666; margin: 10px 0;">Hi ${applicantName},</p>

    <p style="color: #666; line-height: 1.6;">
      Thank you for your interest in <strong>${propertyName}</strong>.
      At this time, we decided to move forward with another applicant for this property. Best wishes in your search for a new home!
    </p>
  `);
}

export function buildDeclineEmailHtml(application: ApplicationRecord, reason: string): string {
  const applicantName = escapeHtml(application.applicant_name);
  const propertyName = escapeHtml(application.property_name);
  const safeReason = escapeHtml(reason);

  return buildEmailHtml(`
    <h2 style="color: #333; margin-top: 0;">Application Decision</h2>
    <p style="color: #666; margin: 10px 0;">Hi ${applicantName},</p>

    <p style="color: #666; line-height: 1.6;">
      Thank you for submitting your rental application for <strong>${propertyName}</strong>.
      We appreciate your interest in our property.
    </p>

    <p style="color: #666; line-height: 1.6;">
      Unfortunately, after careful review, we have decided not to move forward with your application at this time for the following reason:
    </p>

    <div style="background-color: #fff; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <p style="color: #333; margin: 0; font-weight: 500;">${safeReason}</p>
    </div>

    <p style="color: #666; line-height: 1.6;">
      We encourage you to apply for other properties that may be a better fit for your situation.
      If you have any questions, please don't hesitate to reach out to us.
    </p>
  `);
}

export function buildPendingStatusEmailHtml(
  application: ApplicationRecord,
  additionalInfo: string
): string {
  const applicantName = escapeHtml(application.applicant_name);
  const propertyName = escapeHtml(application.property_name);
  const safeAdditionalInfo = escapeHtml(additionalInfo);

  return buildEmailHtml(`
    <h2 style="color: #333; margin-top: 0;">Application Update</h2>
    <p style="color: #666; margin: 10px 0;">Hi ${applicantName},</p>
    <p style="color: #666; line-height: 1.6;">
      We have moved your application to the next stage. Your application for <strong>${propertyName}</strong> is currently pending.
    </p>
    <div style="background-color: #fff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
      <p style="color: #333; margin: 0; white-space: pre-wrap;">${safeAdditionalInfo}</p>
    </div>
  `);
}
