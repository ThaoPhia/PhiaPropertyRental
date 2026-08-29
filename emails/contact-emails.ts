import { escapeHtml } from '@/lib/escape-html';

export function buildContactEmailHtml({
  name,
  email,
  phone,
  comments,
}: {
  name: string;
  email: string;
  phone: string;
  comments: string;
}): string {
  return `
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
  `;
}
