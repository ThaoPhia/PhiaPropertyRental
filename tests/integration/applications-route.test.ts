import { cleanupIntegrationTests, createJsonRequest, prepareIntegrationTest } from './helpers';

async function loadApplicationsRoute() {
  prepareIntegrationTest('phia-applications-route');

  return import('@/app/api/applications/route');
}

function createApplicationPayload(overrides: Record<string, unknown> = {}) {
  return {
    propertyId: 1,
    applicantName: 'Jamie Tenant',
    email: 'JAMIE.TENANT@example.com',
    phone: '920-555-0188',
    currentAddressStreet: '789 Current St',
    currentAddressCity: 'Menasha',
    currentAddressState: 'wi',
    currentAddressZip: '54952',
    currentAddressSinceDate: '2025-09-02',
    householdIncome: '72000',
    moveInDate: '2026-10-02',
    totalOccupancy: '2',
    landlordName: 'Morgan Manager',
    landlordPhone: '920-555-0199',
    additionalInfo: 'Flexible move-in timing.',
    recaptchaToken: 'integration-recaptcha-token',
    ...overrides,
  };
}

afterAll(cleanupIntegrationTests);

describe('applications API route integration', () => {
  it('rejects an application with missing required fields', async () => {
    const { POST } = await loadApplicationsRoute();

    const response = await POST(createJsonRequest(createApplicationPayload({ applicantName: '' })) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'All application fields are required' });
  });

  it('creates an application for an existing property', async () => {
    const { GET, POST } = await loadApplicationsRoute();

    const response = await POST(createJsonRequest(createApplicationPayload()) as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({ success: true, applicationId: expect.any(Number) });

    const listResponse = await GET();
    const applications = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(applications).toHaveLength(1);
    expect(applications[0]).toMatchObject({
      id: body.applicationId,
      applicantName: 'Jamie Tenant',
      email: 'jamie.tenant@example.com',
      phone: '920-555-0188',
      currentAddressStreet: '789 Current St',
      currentAddressCity: 'Menasha',
      currentAddressState: 'WI',
      currentAddressZip: '54952',
      currentAddressSinceDate: '2025-09-02',
      householdIncome: 72000,
      moveInDate: '2026-10-02',
      totalOccupancy: 2,
      landlordName: 'Morgan Manager',
      landlordPhone: '920-555-0199',
      additionalInfo: 'Flexible move-in timing.',
      propertyId: 1,
      propertyName: 'Downtown Duplex',
    });
  });
});