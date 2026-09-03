import { cleanupIntegrationTests, prepareIntegrationTest } from '../integration/helpers';

const adminEmail = 'admin.profile@example.com';
const currentPassword = 'CurrentPassword!123';

async function loadProfileRoute() {
  prepareIntegrationTest('phia-admin-profile-feature', {
    CMS_ADMIN_EMAIL: adminEmail,
    CMS_ADMIN_PASSWORD: currentPassword,
  });

  const [{ PUT }, { createAuthSession }, { getDb }, { verifyPassword }] = await Promise.all([
    import('../../app/api/auth/profile/route'),
    import('../../lib/auth'),
    import('../../lib/db'),
    import('../../lib/password'),
  ]);

  const { token } = await createAuthSession(1);
  return { PUT, token, db: getDb(), verifyPassword };
}

function createProfileRequest(body: Record<string, unknown>, token: string) {
  return {
    cookies: { get: () => ({ value: token }) },
    json: async () => body,
  };
}

afterAll(cleanupIntegrationTests);

describe('admin profile feature', () => {
  it('updates the admin name and password while preserving the account email', async () => {
    const { PUT, token, db, verifyPassword } = await loadProfileRoute();
    const newPassword = 'NewPassword!456';

    const response = await PUT(createProfileRequest({
      name: 'Updated Admin',
      currentPassword,
      newPassword,
    }, token) as never);
    const body = await response.json();
    const user = db.prepare('SELECT name, email, password_hash FROM users WHERE id = 1').get() as {
      name: string;
      email: string;
      password_hash: string;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      admin: { name: 'Updated Admin', email: adminEmail, role: 'admin' },
    });
    expect(user).toMatchObject({ name: 'Updated Admin', email: adminEmail });
    expect(verifyPassword(newPassword, user.password_hash)).toBe(true);
    expect(verifyPassword(currentPassword, user.password_hash)).toBe(false);
  });

  it('rejects a password change with the wrong current password', async () => {
    const { PUT, token } = await loadProfileRoute();

    const response = await PUT(createProfileRequest({
      name: 'Updated Admin',
      currentPassword: 'wrong-password',
      newPassword: 'NewPassword!456',
    }, token) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Current password is incorrect' });
  });
});
