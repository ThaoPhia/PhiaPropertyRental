import { cleanupIntegrationTests, createGetRequest, prepareIntegrationTest } from './helpers';

async function loadPropertiesRoute() {
  prepareIntegrationTest('phia-properties-route');

  return import('@/app/api/properties/route');
}

afterAll(cleanupIntegrationTests);

describe('properties API route integration', () => {
  it('returns public seeded properties', async () => {
    const { GET } = await loadPropertiesRoute();

    const response = await GET(createGetRequest('http://localhost/api/properties') as never);
    const properties = await response.json();

    expect(response.status).toBe(200);
    expect(properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Downtown Duplex',
          status: 'available',
          type: 'duplex',
          city: 'New York',
        }),
        expect.objectContaining({
          name: 'Park View Apartment',
          status: 'available',
          type: 'apartment',
          city: 'New York',
        }),
      ])
    );
  });

  it('filters properties and excludes removed properties for public requests', async () => {
    const { GET } = await loadPropertiesRoute();
    const { ensureDbReady, getDb } = await import('@/lib/db');

    await ensureDbReady();
    getDb().prepare("UPDATE properties SET status = 'removed' WHERE name = ?").run('Park View Apartment');

    const response = await GET(createGetRequest('http://localhost/api/properties?type=duplex&city=New%20York') as never);
    const properties = await response.json();

    expect(response.status).toBe(200);
    expect(properties).toHaveLength(1);
    expect(properties[0]).toMatchObject({
      name: 'Downtown Duplex',
      type: 'duplex',
      city: 'New York',
      status: 'available',
    });
  });
});