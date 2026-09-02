import { cleanupIntegrationTests, createGetRequest, createJsonRequest, prepareIntegrationTest } from './helpers';

const adminEmail = 'admin.integration@example.com';
const adminPassword = 'IntegrationPassword!123';

// Helper function to load the login route for the integration tests.
async function loadLoginRoute() {
  prepareIntegrationTest('phia-auth-login-route', {
    CMS_ADMIN_EMAIL: adminEmail,
    CMS_ADMIN_PASSWORD: adminPassword,
  });

  const [loginRoute, meRoute] = await Promise.all([
    import('@/app/api/auth/login/route'),
    import('@/app/api/auth/me/route'),
  ]);

  return { ...loginRoute, ...meRoute };
}

// Helper function to create the login payload for the tests. 
// Return an object containing the email, password, recaptcha token, and any overrides.
function createLoginPayload(overrides: Record<string, unknown> = {}) {
  return {
    email: adminEmail,
    password: adminPassword,
    recaptchaToken: 'integration-recaptcha-token',
    ...overrides,
  };
}

// Clean up integration tests after all tests have run.
afterAll(cleanupIntegrationTests);

// Integration tests for the auth login API route.
describe('auth login API route integration', () => {
  it('rejects invalid admin credentials', async () => {
    const { POST } = await loadLoginRoute();

    const response = await POST(createJsonRequest(createLoginPayload({ password: 'wrong-password' })) as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Invalid email or password' });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('creates a session cookie for valid admin credentials', async () => {
    const { POST } = await loadLoginRoute();

    // Send a login request with valid admin credentials, including extra whitespace and uppercase letters in the email.
    // The email is intentionally formatted with extra whitespace and uppercase letters to test normalization.
    const response = await POST(createJsonRequest(createLoginPayload({ email: '  ADMIN.INTEGRATION@example.com  ' })) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, email: adminEmail });
    expect(response.headers.get('set-cookie')).toEqual(expect.stringContaining('cms_session='));
    expect(response.headers.get('set-cookie')).toEqual(expect.stringContaining('HttpOnly'));
  });

  // Test to verify that the session persists before and after login.
  it('verifies session persistence before and after login', async () => {
    const { GET, POST } = await loadLoginRoute();

    // Attempt to access the "me" endpoint before logging in.
    let response: Response = await GET(createGetRequest('http://localhost/api/auth/me') as never);
    let body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ isAdmin: false, admin: null });

    // Perform login to create a session.
    response = await POST(createJsonRequest(createLoginPayload()) as never);
    body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, email: adminEmail });
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toEqual(expect.stringContaining('cms_session='));

    // Attempt to access the "me" endpoint after logging in with the session cookie.
    response = await GET(createGetRequest('http://localhost/api/auth/me', cookie || '') as never);
    body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      isAdmin: true,
      admin: {
        email: adminEmail,
        role: 'admin',
      },
    });
  });
});