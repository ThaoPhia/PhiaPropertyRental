import { cleanupIntegrationTests, createJsonRequest, prepareIntegrationTest } from '../integration/helpers';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

jest.mock('../../lib/recaptcha-server', () => ({
  verifyRecaptchaToken: jest.fn().mockResolvedValue(true),
}));

function createContactPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Jamie Tenant',
    email: 'JAMIE.TENANT@example.com',
    phone: '920-555-0188',
    comments: 'I would like to schedule a viewing.',
    recaptchaToken: 'feature-recaptcha-token',
    ...overrides,
  };
}

async function loadContactRoute() {
  prepareIntegrationTest('phia-contact-feature', {
    SITE_NAME: 'Phia Rental LLC',
    SITE_EMAIL_TO: 'owner@example.com',
    SITE_EMAIL_FROM: 'noreply@example.com',
    RESEND_API_KEY: 'feature-test-key',
  });

  mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });
  return import('@/app/api/contact/route');
}

afterAll(cleanupIntegrationTests);

describe('contact form feature', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('sends a normalized contact request email after validation and reCAPTCHA', async () => {
    const { POST } = await loadContactRoute();

    const response = await POST(createJsonRequest(createContactPayload()) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'owner@example.com',
      replyTo: 'owner@example.com',
      subject: 'Contact Form Submission - Jamie Tenant',
      html: expect.stringContaining('jamie.tenant@example.com'),
    }));
  });

  it('rejects a contact request before sending email when a required field is missing', async () => {
    const { POST } = await loadContactRoute();

    const response = await POST(createJsonRequest(createContactPayload({ comments: '' })) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'All fields are required' });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
