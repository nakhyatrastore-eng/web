import { expect, test } from '@playwright/test';

test('home page exposes the complete storefront navigation and honest catalogue state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: "Designs that don't blend in." })).toBeVisible();
  await expect(page.getByTestId('product-card').first()).toBeVisible();
  await expect(page.getByText(/visual preview|ordering closed|mock price|checkout locked/i)).toHaveCount(0);
  await expect(page.getByText(/bundle automatically|eligible shopify offers|never dropshipped|metal-backed build/i)).toHaveCount(0);
});

test('mobile home uses the approved four-item navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/');

  const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
  await expect(mobileNav.getByText('Home', { exact: true })).toBeVisible();
  await expect(mobileNav.getByText('Phone Cases', { exact: true })).toBeVisible();
  await expect(mobileNav.getByText('Metal Posters', { exact: true })).toBeVisible();
  await expect(mobileNav.getByText('Tracking', { exact: true })).toBeVisible();
  await expect(mobileNav.getByText('Cart', { exact: true })).toHaveCount(0);
});

test('case collection does not expose filters that cannot change the catalogue', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nakhyatra-device-prompted:v1', 'true'));
  await page.goto('/collections/phone-cases');

  await expect(page.getByRole('link', { name: 'iPhone', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Samsung', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Featured', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Price low', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('product-card').first()).toBeVisible();
});

test('all primary pages and policy links resolve', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nakhyatra-device-prompted:v1', 'true'));
  for (const path of [
    '/collections/phone-cases',
    '/collections/poster-wall',
    '/themes/cyberpunk',
    '/track',
    '/policies/shipping',
    '/policies/returns',
    '/policies/privacy',
    '/policies/terms',
    '/policies/contact',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBeLessThan(400);
    await expect(page.locator('h1').first(), path).toBeVisible();
  }
});

test('legacy custom URL permanently resolves to the studio', async ({ page }) => {
  await page.goto('/custom');
  await expect(page).toHaveURL(/\/create$/);
});

test('search drawer returns live Shopify products and handles no matches', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('searchbox').fill('Arctic');
  await expect(page.getByRole('link', { name: /Arctic Frequency/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('searchbox').fill('definitely-no-such-design-92841');
  await expect(page.getByText(/no match/i)).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Search the store' })).toHaveCount(0);
});

test('cart API rejects malformed merchandise without creating a cart', async ({ request }) => {
  const response = await request.post('/api/cart', {
    data: { action: 'add', merchandiseId: '12345', quantity: 1 },
  });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
});

test('cart API rejects a phone case without a verified phone selection', async ({ request }) => {
  const response = await request.post('/api/cart', {
    data: {
      action: 'add',
      merchandiseId: 'gid://shopify/ProductVariant/44665946439746',
      quantity: 1,
      attributes: [],
    },
  });
  expect(response.status()).toBe(422);
  await expect(response.json()).resolves.toMatchObject({ error: expect.stringMatching(/phone model/i) });
});

test('headless SEO stays on nakhyatra.store', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nakhyatra-device-prompted:v1', 'true'));
  await page.goto('/collections/phone-cases');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nakhyatra.store/collections/phone-cases');
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const body = await sitemap.text();
  expect(body).toContain('https://nakhyatra.store');
  expect(body).not.toContain('checkout.nakhyatra.store');
  expect(body).not.toContain('/bundle');
  expect(body).not.toContain('/create');
  expect(body).not.toContain('/themes/');
  expect(body).not.toContain('/collections/frontpage');
});

test('a real published product can select a stocked device, persist a Shopify cart, and hand off checkout', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nakhyatra-device-prompted:v1', 'true'));
  await page.goto('/collections/phone-cases');
  const card = page.getByTestId('product-card').first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/products\//);

  await page.getByTestId('device-picker').click();
  const sheet = page.getByTestId('shopping-sheet');
  await expect(sheet).toBeVisible();
  const picker = sheet.getByTestId('device-picker');
  await picker.getByTestId('device-platform').first().click();
  const model = picker.getByTestId('device-model:not([disabled])').first();
  await expect(model).toBeVisible();
  await model.click();

  const add = page.getByTestId('add-to-cart');
  await expect(add).toBeEnabled();
  await add.click();
  await expect(page.getByRole('dialog', { name: 'Your cart' })).toBeVisible();
  await page.reload();
  await page.locator('#cart-open-btn').click();
  await expect(page.getByRole('dialog', { name: 'Your cart' })).toContainText('Subtotal');
  await expect(page.getByRole('dialog', { name: 'Your cart' })).toContainText('Phone Model');
  const checkoutResponse = await page.evaluate(async () => {
    const response = await fetch('/api/checkout', { method: 'POST' });
    return {
      ok: response.ok,
      payload: (await response.json()) as { url: string; error?: string },
    };
  });
  expect(checkoutResponse.ok, checkoutResponse.payload.error).toBeTruthy();
  const checkoutUrl = new URL(checkoutResponse.payload.url);
  expect(checkoutUrl.hostname).toBe('checkout.nakhyatra.store');
  expect(checkoutUrl.pathname).toMatch(/^\/(?:checkouts|cart\/c)\//);
});

test('My Phone remembers one exact fit and model-safe quick add uses it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/collections/phone-cases');

  const sheet = page.getByTestId('shopping-sheet');
  await expect(sheet).toBeVisible({ timeout: 5_000 });
  const picker = sheet.getByTestId('device-picker');
  await picker.getByTestId('device-platform').first().click();
  const modelButton = picker.getByTestId('device-model:not([disabled])').first();
  const chosenModel = ((await modelButton.textContent()) ?? '').trim();
  await modelButton.click();

  await expect(sheet).toHaveCount(0);
  await expect(page.locator('.device-context-bar')).toContainText(chosenModel ?? '');
  await page.reload();
  await expect(page.locator('.device-context-bar')).toContainText(chosenModel ?? '');

  await page.getByTestId('quick-add').first().click();
  const quickSheet = page.getByTestId('shopping-sheet');
  await expect(quickSheet).toContainText(chosenModel ?? '');
  await quickSheet.locator('button.button-primary').click();
  const cart = page.getByRole('dialog', { name: 'Your cart' });
  await expect(cart).toBeVisible();
  await expect(cart).toContainText(chosenModel ?? '');
});

test('custom studio redirects buyers until dedicated real Shopify products exist', async ({ page }) => {
  await page.goto('/create');
  await expect(page).toHaveURL(/\/collections\/phone-cases$/);
  await expect(page.getByTestId('custom-add-to-cart')).toHaveCount(0);
});

test('poster builder remains hidden from search until it has enough inventory', async ({ page }) => {
  await page.goto('/bundle');
  await expect(page).toHaveURL(/\/collections\/poster-wall$/);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /poster set|bundle/i })).toHaveCount(0);
});
