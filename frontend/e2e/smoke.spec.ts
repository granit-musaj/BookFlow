import { expect, test, type Page } from '@playwright/test';

const apiUrl = process.env.SMOKE_API_URL || process.env.VITE_API_URL;
const slug = process.env.SMOKE_SLUG || process.env.SEED_BUSINESS_SLUG;
const ownerEmail = process.env.SMOKE_OWNER_EMAIL || process.env.SEED_OWNER_EMAIL;
const ownerPassword = process.env.SMOKE_OWNER_PASSWORD || process.env.SEED_OWNER_PASSWORD;

async function clearDemoStorage(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('bookflow-demo');
      localStorage.removeItem('bookflow-aureel-v1');
      localStorage.removeItem('bookflow-demo-user');
      sessionStorage.removeItem('bookflow-demo');
      sessionStorage.removeItem('bookflow-aureel-v1');
      sessionStorage.removeItem('bookflow-demo-user');
    } catch {
      // private mode
    }
  });
}

async function expectLiveApi(page: Page) {
  const demoOn = await page.evaluate(() => {
    try {
      return sessionStorage.getItem('bookflow-demo') === '1' || localStorage.getItem('bookflow-demo') === '1';
    } catch {
      return false;
    }
  });
  expect(demoOn, 'demo interceptor must stay off for real-API smoke').toBeFalsy();
  await expect(page.getByText(/Modaliteti i provës|Modalitet prove/)).toHaveCount(0);
}

async function pickFirstFreeSlot(page: Page) {
  await expect(page.getByRole('heading', { name: '2. Zgjidh orarin' })).toBeVisible({ timeout: 15_000 });

  const slotButton = page.locator('.time-grid button').first();
  const emptyDay = page.getByText('Nuk ka orare të lira këtë ditë.');

  async function waitForSlotsResult() {
    await Promise.race([
      slotButton.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => null),
      emptyDay.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => null),
    ]);
    if (await slotButton.isVisible().catch(() => false)) {
      await slotButton.click();
      return true;
    }
    return false;
  }

  if (await waitForSlotsResult()) {
    return true;
  }

  const days = page.locator('.calendar button:not([disabled])');
  const dayCount = Math.min(await days.count(), 8);
  for (let index = 1; index < dayCount; index += 1) {
    const slotsResponse = page
      .waitForResponse((response) => response.url().includes('/slots') && response.request().method() === 'GET', {
        timeout: 15_000,
      })
      .catch(() => null);
    await days.nth(index).click();
    await slotsResponse;
    if (await waitForSlotsResult()) {
      return true;
    }
  }

  return false;
}

async function logoutFromPanel(page: Page) {
  const heading = page.getByRole('heading', { name: 'Mirë se u ktheve' });
  const dil = page.locator('.sidebar-foot').getByRole('button', { name: 'Dil' });
  await expect(dil).toBeVisible({ timeout: 15_000 });

  const logoutResponse = page.waitForResponse(
    (response) => response.url().includes('/auth/logout') && response.request().method() === 'POST',
    { timeout: 15_000 },
  );
  await dil.click();
  await logoutResponse;
  await expect(heading).toBeVisible({ timeout: 15_000 });
}

test.describe('real API smoke', () => {
  test.skip(!apiUrl, 'VITE_API_URL / SMOKE_API_URL is not set');

  test('register/login, book as CLIENT, confirm as Owner', async ({ page }) => {
    test.skip(!slug || !ownerEmail || !ownerPassword, 'seed slug and owner credentials are required');

    const email = `smoke.${Date.now()}@example.com`;
    const password = `Smoke${Date.now()}x`;
    const firstName = 'Smoke';
    const lastName = 'Klient';

    await clearDemoStorage(page);

    const catalog = page.waitForResponse(
      (response) =>
        response.url().includes(`/public/businesses/${slug}`) &&
        !response.url().includes('/slots') &&
        response.request().method() === 'GET',
      { timeout: 20_000 },
    );
    await page.goto(`/b/${slug}`);
    await catalog;
    await expect(page.getByRole('heading', { name: 'Rezervo një seancë' })).toBeVisible();
    await expectLiveApi(page);

    const service = page.locator('section button').filter({ hasText: /minuta|€/ }).first();
    await expect(service).toBeVisible({ timeout: 15_000 });
    await service.click();
    await page.getByRole('button', { name: 'Vazhdo' }).click();

    const picked = await pickFirstFreeSlot(page);
    expect(picked, 'API returned no free slots for the seeded staff').toBeTruthy();

    await page.getByRole('button', { name: 'Vazhdo' }).click();
    await page.getByRole('button', { name: 'Klient i ri' }).click();
    await page.getByLabel('Emri', { exact: true }).fill(firstName);
    await page.getByLabel('Mbiemri', { exact: true }).fill(lastName);
    await page.locator('form').getByLabel('Email').fill(email);
    await page.locator('form').getByLabel('Fjalëkalimi').fill(password);

    const register = page.waitForResponse(
      (response) => response.url().includes('/auth/register') && response.request().method() === 'POST',
      { timeout: 20_000 },
    );
    await page.getByRole('button', { name: 'Krijo llogarinë' }).click();
    const registerResponse = await register;
    expect(registerResponse.ok(), `register failed: ${registerResponse.status()}`).toBeTruthy();
    await expect(page.getByText(`${firstName} ${lastName}`).first()).toBeVisible();

    await page.getByRole('button', { name: 'Vazhdo' }).click();
    const book = page.waitForResponse(
      (response) => response.url().includes('/bookings') && response.request().method() === 'POST',
      { timeout: 20_000 },
    );
    await page.getByRole('button', { name: 'Dërgo rezervimin' }).click();
    const bookResponse = await book;
    expect(bookResponse.ok(), `public booking failed: ${bookResponse.status()}`).toBeTruthy();
    await expect(page.getByText('Je në listë')).toBeVisible();
    await expectLiveApi(page);

    await page.getByRole('link', { name: 'Shiko rezervimet e mia' }).click();
    await logoutFromPanel(page);
    await page.locator('.auth-screen').getByLabel('Email').fill(ownerEmail);
    await page.locator('.auth-screen').getByLabel('Fjalëkalimi').fill(ownerPassword);
    const login = page.waitForResponse(
      (response) => response.url().includes('/auth/login') && response.request().method() === 'POST',
      { timeout: 20_000 },
    );
    await page.getByRole('button', { name: 'Hyr' }).click();
    const loginResponse = await login;
    expect(loginResponse.ok(), `owner login failed: ${loginResponse.status()}`).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Përmbledhje' })).toBeVisible({ timeout: 15_000 });
    await expectLiveApi(page);

    await page.getByRole('navigation', { name: 'Navigimi i panelit' }).getByRole('link', { name: /Rezervim i ri/ }).click();
    await expect(page.getByRole('heading', { name: 'Rezervim i ri' })).toBeVisible({ timeout: 15_000 });

    const search = page.locator('label.field').filter({ hasText: 'Kërko' }).locator('input');
    await search.fill(firstName);

    const pending = page.locator('li').filter({ hasText: firstName }).filter({ hasText: 'Konfirmo' }).first();
    await expect(pending).toBeVisible({ timeout: 15_000 });
    const confirm = page.waitForResponse(
      (response) => response.url().includes('/confirm') && response.request().method() === 'POST',
      { timeout: 20_000 },
    );
    await pending.getByRole('button', { name: 'Konfirmo' }).click();
    const confirmResponse = await confirm;
    expect(confirmResponse.ok(), `confirm failed: ${confirmResponse.status()}`).toBeTruthy();
    await expect(page.locator('li').filter({ hasText: firstName }).filter({ hasText: 'Konfirmuar' }).first()).toBeVisible();
  });
});
