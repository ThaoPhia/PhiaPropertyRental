import { expect, type Page } from '@playwright/test';

export async function openFirstPropertyDetail(page: Page) {
  await page.goto('/properties');

  const detailLink = page.getByRole('link', { name: /View Full Details/ }).first();
  const detailHref = await detailLink.getAttribute('href');
  expect(detailHref).toMatch(/^\/properties\/\d+$/);

  await detailLink.click();
  await expect(page).toHaveURL(detailHref!);
}

export async function mockRecaptcha(page: Page) {
  await page.addInitScript(() => {
    const testWindow = window as Window & {
      grecaptcha: {
        ready: (callback: () => void) => void;
        execute: () => Promise<string>;
      };
    };

    testWindow.grecaptcha = {
      ready: (callback: () => void) => callback(),
      execute: async () => 'e2e-recaptcha-token',
    };
  });
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().split('T')[0];
}