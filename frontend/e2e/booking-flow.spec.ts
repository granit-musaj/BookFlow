import { expect, test } from '@playwright/test';

test.describe('rezervim i ri', () => {
  test('pronari konfirmon dhe krijon një rezervim', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Provo si pronar' }).click();

    await expect(page.getByRole('heading', { name: 'Rezervim i ri' })).toBeVisible();
    await expect(page.getByText('Studio Aureel').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Rezervim i ri' })).toBeVisible();

    const pending = page.locator('li').filter({ hasText: 'Konfirmo' }).first();
    const who = ((await pending.locator('p').first().textContent()) ?? '').trim();
    await pending.getByRole('button', { name: 'Konfirmo' }).click();
    await expect(page.locator('li').filter({ hasText: who }).filter({ hasText: 'Konfirmuar' }).first()).toBeVisible();

    await page.getByRole('button', { name: '18:00' }).click();
    await page.getByRole('button', { name: 'Krijo rezervimin' }).click();
    await expect(page.locator('li').filter({ hasText: '18:00' }).first()).toBeVisible();

    await page.getByRole('navigation', { name: 'Navigimi i panelit' }).getByRole('link', { name: /Njoftime/ }).click();
    await expect(page.getByRole('heading', { name: 'Njoftime' })).toBeVisible();
    await expect(page.getByText(/kërkoi|Kujtesë rezervimi|fillon pas/).first()).toBeVisible();
  });

  test('faqja publike tregon shërbimet e Studio Aureel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Provo si klient' }).click();

    await expect(page.getByRole('heading', { name: 'Rezervo një seancë' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Masazh terapeutik/ })).toBeVisible();
    await page.getByRole('button', { name: 'Vazhdo' }).click();
    await page.getByRole('button', { name: '14:00' }).click();
    await page.getByRole('button', { name: 'Vazhdo' }).click();
    await page.getByRole('button', { name: 'Vazhdo' }).click();
    await expect(page.getByRole('button', { name: 'Dërgo rezervimin' })).toBeEnabled();
  });

  test('dërgimi duket pa scroll në 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Provo si klient' }).click();

    await expect(page.getByRole('heading', { name: 'Rezervo një seancë' })).toBeVisible();
    await page.getByRole('button', { name: /Masazh terapeutik/ }).click();
    await page.getByRole('button', { name: 'Vazhdo' }).click();
    await page.getByRole('button', { name: '14:00' }).click();
    await page.getByRole('button', { name: 'Vazhdo' }).click();
    await page.getByRole('button', { name: 'Vazhdo' }).click();

    const send = page.getByRole('button', { name: 'Dërgo rezervimin' });
    await expect(send).toBeVisible();
    await expect(send).toBeInViewport();
    const box = await send.boundingBox();
    expect(box).toBeTruthy();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(768);
  });
});
