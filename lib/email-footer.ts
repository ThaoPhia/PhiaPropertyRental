import { escapeHtml } from '@/lib/escape-html';

export function getEmailFooterHtml(): string {
  const siteName = process.env.SITE_NAME || 'Phia Rental';
  const sitePhone = process.env.SITE_PHONE_NUMBER || '';
  const siteEmail = process.env.SITE_EMAIL_TO || '';

  const phoneLine = sitePhone
    ? `<p style="color: #666; margin: 6px 0 0 0;">Phone: <a href="tel:${escapeHtml(sitePhone)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(sitePhone)}</a></p>`
    : '';
  const emailLine = siteEmail
    ? `<p style="color: #666; margin: 4px 0 0 0;">Email: <a href="mailto:${escapeHtml(siteEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(siteEmail)}</a></p>`
    : '';

  return `
    <div style="margin: 20px 0 0 0;">
      <p style="color: #666; margin: 0;">
        Best regards,<br>
        <strong>${escapeHtml(siteName)}</strong>
      </p>
      ${phoneLine}
      ${emailLine}
    </div>
  `;
}
