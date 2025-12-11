import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Discount Code System E2E', () => {
  
  test.skip('Apply valid discount code', async ({ page }) => {
    await page.goto('/ca/centres/barcelona/sessions/sauna-finlandesa');
    await page.waitForSelector('[data-discount-code-input]', { timeout: 10000 });
    await page.fill('[data-discount-code-input]', 'VERANO20');
    await page.click('[data-discount-apply-btn]');
    await page.waitForSelector('[data-discount-badge]', { timeout: 5000 });
    const badge = page.locator('[data-discount-badge]');
    await expect(badge).toBeVisible();
  });

  test.skip('Show error for invalid code', async ({ page }) => {
    await page.goto('/ca/centres/barcelona/sessions/sauna-finlandesa');
    await page.waitForSelector('[data-discount-code-input]');
    await page.fill('[data-discount-code-input]', 'INVALID');
    await page.click('[data-discount-apply-btn]');
    await page.waitForSelector('[data-discount-message]', { timeout: 5000 });
    await expect(page.locator('[data-discount-message]')).toBeVisible();
  });

  test.skip('Remove applied discount', async ({ page }) => {
    await page.goto('/ca/centres/barcelona/sessions/sauna-finlandesa');
    await page.fill('[data-discount-code-input]', 'VERANO20');
    await page.click('[data-discount-apply-btn]');
    await page.waitForSelector('[data-discount-badge]');
    await page.click('[data-discount-remove-btn]');
    await expect(page.locator('[data-discount-badge]')).not.toBeVisible();
  });

  test.skip('Keyboard Enter to apply', async ({ page }) => {
    await page.goto('/ca/centres/barcelona/sessions/sauna-finlandesa');
    await page.fill('[data-discount-code-input]', 'VERANO20');
    await page.press('[data-discount-code-input]', 'Enter');
    await page.waitForSelector('[data-discount-badge]');
    await expect(page.locator('[data-discount-badge]')).toBeVisible();
  });

  test.skip('Keyboard Escape to clear', async ({ page }) => {
    await page.goto('/ca/centres/barcelona/sessions/sauna-finlandesa');
    await page.fill('[data-discount-code-input]', 'SOMECODE');
    await page.press('[data-discount-code-input]', 'Escape');
    await expect(page.locator('[data-discount-code-input]')).toHaveValue('');
  });

  test.skip('Loading state shown', async ({ page }) => {
    await page.goto('/ca/centres/barcelona/sessions/sauna-finlandesa');
    await page.fill('[data-discount-code-input]', 'VERANO20');
    await page.locator('[data-discount-apply-btn]').click();
    await expect(page.locator('.btn-loading')).toBeVisible({ timeout: 1000 });
  });

  test.skip('No accessibility violations - idle', async ({ page }) => {
    await page.goto('/ca/centres/barcelona/sessions/sauna-finlandesa');
    await page.waitForSelector('[data-discount-code-input]', { state: 'visible', timeout: 10000 });
    const results = await new AxeBuilder({ page }).include('.discount-code-section').analyze();
    expect(results.violations).toHaveLength(0);
  });
});
