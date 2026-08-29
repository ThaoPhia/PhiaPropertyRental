import { Resend } from 'resend';
import { getDb } from '@/lib/db';
import { ApplicationStatus } from '@/lib/types/types';
import type { ApplicationRecord, DeclinedApplicantNotificationTarget } from '@/lib/types/apiTypes';

const resend = new Resend(process.env.RESEND_API_KEY);

export function resolveRecipientEmail(email: string): string {
  return process.env.NODE_ENV === 'development' ? process.env.SITE_EMAIL_TO || email : email;
}

export function getApplicationById(applicationId: number): ApplicationRecord | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM applications WHERE id = ? AND status != ?')
    .get(applicationId, ApplicationStatus.DELETED) as ApplicationRecord | undefined;
}

export function getRecentlyDeclinedApplicants(
  propertyId: number,
  approvedApplicationId: number
): DeclinedApplicantNotificationTarget[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, email, applicant_name, property_name
    FROM applications
    WHERE property_id = ? AND id != ? AND status NOT IN ('${ApplicationStatus.DELETED}', '${ApplicationStatus.DECLINED}', '${ApplicationStatus.APPROVED}', '${ApplicationStatus.APPROVE_ARCHIVED}')
  `).all(propertyId, approvedApplicationId) as DeclinedApplicantNotificationTarget[];
}

export function updateApplicationStatuses(propertyId: number, approvedApplicationId: number): void {
  const db = getDb();
  // Set declined for all other applications for the same property that are not already deleted, declined, or approved
  db.prepare(`
    UPDATE applications
    SET status = '${ApplicationStatus.DECLINED}'
    WHERE property_id = ? AND id != ? AND status NOT IN ('${ApplicationStatus.DELETED}', '${ApplicationStatus.DECLINED}', '${ApplicationStatus.APPROVED}', '${ApplicationStatus.APPROVE_ARCHIVED}')
  `).run(propertyId, approvedApplicationId);

  // Set old approved applicant to approve-archived
  db.prepare('UPDATE applications SET status = ? WHERE property_id = ? AND status = ? AND id != ?')
    .run(ApplicationStatus.APPROVE_ARCHIVED, propertyId, ApplicationStatus.APPROVED, approvedApplicationId);
  // Now set the new applicant as approved
  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(ApplicationStatus.APPROVED, approvedApplicationId);
}

export async function sendApplicationStatusEmail(
  email: string,
  propertyName: string,
  html: string
) {
  return resend.emails.send({
    from: `${process.env.SITE_NAME} <${process.env.SITE_EMAIL_FROM}>`,
    to: resolveRecipientEmail(email),
    replyTo: process.env.SITE_EMAIL_TO,
    subject: `Application Status - ${propertyName}`,
    html,
  });
}

