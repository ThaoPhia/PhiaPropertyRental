import { expect, test } from '@playwright/test';
import { addDays, mockRecaptcha, openFirstPropertyDetail } from './helpers';

test('shows the properties listing with available property actions', async ({ page }) => {
  await page.goto('/properties');

  await expect(page.getByRole('heading', { name: 'Beautiful Homes, Carefully Maintained' })).toBeVisible();
  await expect(page.getByText(/Properties? Available/)).toBeVisible();
  await expect(page.getByRole('link', { name: /View Full Details/ }).first()).toBeVisible();
});

test('does not render broken images on the properties listing', async ({ page }) => {
  await page.goto('/properties');

  const images = await page.locator('img').evaluateAll((elements) =>
    elements.map((element) => {
      const image = element as HTMLImageElement;

      return {
        alt: image.getAttribute('alt') ?? '',
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    })
  );

  expect(images.length).toBeGreaterThan(0);
  expect(images.filter((image) => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0)).toEqual([]);
});

test('opens a property detail page from the listing', async ({ page }) => {
  await openFirstPropertyDetail(page);

  await expect(page.getByRole('link', { name: /Back to Properties/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();
  await expect(page.locator('iframe[title^="Map of"]')).toBeVisible();
});

test('requires application form fields before submitting', async ({ page }) => {
  await mockRecaptcha(page);

  let applicationSubmitted = false;
  // Intercept the API request to track if the application is submitted
  await page.route('**/api/applications', async (route) => {
    applicationSubmitted = true;
    await route.fulfill({ status: 201, json: { success: true, applicationId: 1 } });
  });

  await openFirstPropertyDetail(page);
  await page.getByLabel(/I understand if my application is accepted/).check();
  await page.getByRole('button', { name: 'Submit Application' }).click();

  await expect(page.locator('#applicant-name')).toBeFocused();
  expect(applicationSubmitted).toBe(false);
});

test('submits a property application with all required fields', async ({ page }) => {
  await mockRecaptcha(page);

  let applicationPayload: Record<string, unknown> | null = null;
  // Intercept the API request to capture the application payload
  await page.route('**/api/applications', async (route) => {
    applicationPayload = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
    await route.fulfill({ status: 201, json: { success: true, applicationId: 123 } });
  });

  await openFirstPropertyDetail(page);

  const moveInDate = addDays(new Date(), 30);
  const currentAddressSinceDate = addDays(new Date(), -365);

  await page.getByLabel('Applicant Full Name').fill('Jamie Tenant');
  await page.getByLabel('Email').fill('jamie.tenant@example.com');
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('920-555-0188');
  await page.getByLabel('Household Income').fill('72000');
  await page.getByLabel(/Preferred Move-in Date/).fill(moveInDate);
  await page.getByLabel(/Total Number of Occupancy/).fill('2');
  await page.getByLabel(/Start Date/).fill(currentAddressSinceDate);
  await page.getByLabel('Street Address').fill('789 Current St');
  await page.getByPlaceholder('City').fill('Menasha');
  await page.getByPlaceholder('State').fill('WI');
  await page.getByPlaceholder('Zip Code').fill('54952');
  await page.getByLabel('Landlord Name').fill('Morgan Manager');
  await page.getByLabel('Landlord Phone').fill('920-555-0199');
  await page.getByLabel(/I understand if my application is accepted/).check();

  await page.getByRole('button', { name: 'Submit Application' }).click();

  await expect(page.getByText('Application submitted successfully. We will contact you soon.')).toBeVisible();
  expect(applicationPayload).toMatchObject({
    applicantName: 'Jamie Tenant',
    email: 'jamie.tenant@example.com',
    phone: '920-555-0188',
    currentAddressStreet: '789 Current St',
    currentAddressCity: 'Menasha',
    currentAddressState: 'WI',
    currentAddressZip: '54952',
    currentAddressSinceDate,
    householdIncome: '72000',
    moveInDate,
    totalOccupancy: '2',
    landlordName: 'Morgan Manager',
    landlordPhone: '920-555-0199',
    recaptchaToken: 'e2e-recaptcha-token',
  });
});