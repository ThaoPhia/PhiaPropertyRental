/** @jest-environment node */

import { sendEmail } from '@/lib/email';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const message = {
  to: 'tenant@example.com',
  replyTo: 'owner@example.com',
  subject: 'Application status',
  html: '<p>Test notification</p>',
};

describe('email delivery', () => {
  beforeEach(() => {
    jest.replaceProperty(process, 'env', {
      NODE_ENV: 'development',
      SITE_NAME: 'Phia Rental LLC',
      SITE_EMAIL_FROM: 'noreply@example.com',
      RESEND_API_KEY: 'test-key',
    });
    mockSend.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps Resend delivery when Mailpit is not configured', async () => {
    mockSend.mockResolvedValue({ data: { id: 'resend-id' }, error: null });
    const result = await sendEmail(message);

    expect(mockSend).toHaveBeenCalledWith({
      from: 'Phia Rental LLC <noreply@example.com>',
      ...message,
    });
    expect(result.data?.id).toBe('resend-id');
  });

  it('captures development email in Mailpit without using Resend', async () => {
    process.env.MAILPIT_URL = 'http://mailpit:8025/';
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ID: 'mailpit-id' }),
    );

    expect(await sendEmail(message)).toEqual({ data: { id: 'mailpit-id' }, error: null });
    expect(fetchMock).toHaveBeenCalledWith('http://mailpit:8025/api/v1/send', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        From: { Email: 'noreply@example.com', Name: 'Phia Rental LLC' },
        To: [{ Email: 'tenant@example.com' }],
        ReplyTo: [{ Email: 'owner@example.com' }],
        Subject: message.subject,
        HTML: message.html,
      }),
    }));
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects Mailpit in production instead of capturing real email', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production', MAILPIT_URL: 'http://mailpit:8025' });
    await expect(sendEmail(message)).rejects.toThrow('only supported in development');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('uses Resend in production when Mailpit is not configured', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
    mockSend.mockResolvedValue({ data: { id: 'production-id' }, error: null });
    expect((await sendEmail(message)).data?.id).toBe('production-id');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('surfaces HTTP failures without falling back to Resend', async () => {
    process.env.MAILPIT_URL = 'http://mailpit:8025';
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Unavailable', { status: 503 }));
    await expect(sendEmail(message)).rejects.toThrow('HTTP 503');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('surfaces network failures without falling back to Resend', async () => {
    process.env.MAILPIT_URL = 'http://mailpit:8025';
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Connection refused'));
    await expect(sendEmail(message)).rejects.toThrow('Connection refused');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects an invalid success response', async () => {
    process.env.MAILPIT_URL = 'http://mailpit:8025';
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({}));
    await expect(sendEmail(message)).rejects.toThrow('invalid email ID');
  });
});
