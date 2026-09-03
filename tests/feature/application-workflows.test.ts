import { cleanupIntegrationTests, createJsonRequest, prepareIntegrationTest } from '../integration/helpers';
import { ApplicationStatus } from '../../lib/types/types';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Helper function to load the route and prepare the database for integration tests.
async function loadRoute(path: string) {
  prepareIntegrationTest('phia-application-workflow-feature', {
    RESEND_API_KEY: 'feature-test-key',
    SITE_NAME: 'Phia Rental LLC',
    SITE_EMAIL_TO: 'owner@example.com',
    SITE_EMAIL_FROM: 'noreply@example.com',
  });

  mockSend.mockReset();
  mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

  const route = await import(path);
  const { ensureDbReady, getDb } = await import('../../lib/db');
  await ensureDbReady();

  return { ...route, db: getDb() };
}

// Helper function to insert a new application into the database for testing purposes. Returns the inserted application's ID.
function insertApplication(db: { prepare: (sql: string) => { run: (...values: unknown[]) => { lastInsertRowid: number | bigint } } }, email: string, status = ApplicationStatus.PENDING) {
  const result = db.prepare(`
    INSERT INTO applications (
      property_id, property_name, applicant_name, email, phone,
      current_address_street, current_address_city, current_address_state,
      current_address_zip, current_address_since_date, household_income,
      move_in_date, total_occupancy, landlord_name, landlord_phone,
      additional_info, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    'Downtown Duplex',
    email,
    email,
    '920-555-0188',
    '789 Current St',
    'Menasha',
    'WI',
    '54952',
    '2025-09-02',
    72000,
    '2026-10-02',
    2,
    'Morgan Manager',
    '920-555-0199',
    'Flexible move-in timing.',
    status,
  );

  return Number(result.lastInsertRowid);
}

afterAll(cleanupIntegrationTests);

describe('application workflow features', () => {
  it('approves one applicant, declines the other pending applicants, and sends notifications', async () => {
    const { POST, db } = await loadRoute('../../app/api/applications/approve/route');
    const approvedId = insertApplication(db, 'approved@example.com');
    const declinedId = insertApplication(db, 'declined@example.com');

    const response = await POST(createJsonRequest({ applicationId: approvedId }) as never);
    const body = await response.json();
    const statuses = db.prepare('SELECT id, status FROM applications ORDER BY id').all();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true });
    expect(statuses).toEqual([
      { id: approvedId, status: ApplicationStatus.APPROVED },
      { id: declinedId, status: ApplicationStatus.DECLINED },
    ]);
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenNthCalledWith(1, expect.objectContaining({ to: 'approved@example.com' }));
    expect(mockSend).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: 'declined@example.com' }));
  });

  it('sends a pending update email but does not send an email when deleting', async () => {
    const { POST, db } = await loadRoute('../../app/api/applications/status/route');
    const applicationId = insertApplication(db, 'applicant@example.com');

    let response = await POST(createJsonRequest({
      applicationId,
      status: ApplicationStatus.PENDING,
      additionalInfo: 'Please provide one more document.',
    }) as never);

    expect(response.status).toBe(200);
    // Check that an email was sent for the pending status update
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(db.prepare('SELECT status FROM applications WHERE id = ?').get(applicationId)).toEqual({
      status: ApplicationStatus.PENDING,
    });

    mockSend.mockClear();
    response = await POST(createJsonRequest({
      applicationId,
      status: ApplicationStatus.DELETED,
    }) as never);

    expect(response.status).toBe(200);
    // Check that no email was sent for the deleted status
    expect(mockSend).not.toHaveBeenCalled();
    expect(db.prepare('SELECT status FROM applications WHERE id = ?').get(applicationId)).toEqual({
      status: ApplicationStatus.DELETED,
    });
  });
});
