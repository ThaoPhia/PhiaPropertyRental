import { expect, test } from '@playwright/test';

test('redirects unauthenticated users to the CMS login page', async ({ page }) => {
  await page.goto('/cms');

  await expect(page).toHaveURL('/cms/login');
  await expect(page.getByRole('heading', { name: 'CMS Login' })).toBeVisible();
});

test('logs in to the CMS with valid admin credentials', async ({ page }) => {
  const adminEmail = process.env.CMS_ADMIN_EMAIL;
  const adminPassword = process.env.CMS_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('CMS_ADMIN_EMAIL and CMS_ADMIN_PASSWORD must be configured to run the CMS login test');
  }

  await page.goto('/cms/login');
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/cms');
  await expect(page.getByRole('heading', { name: 'Property Management System' })).toBeVisible();
});