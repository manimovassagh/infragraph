import { test, expect } from '@playwright/test';
import path from 'node:path';

const FIXTURE = path.resolve(
  __dirname,
  '../../apps/backend/src/fixtures/sample.tfstate'
);

test.describe('Upload flow', () => {
  test('shows upload area on initial load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/upload/i).first()).toBeVisible();
  });

  test('uploads tfstate and shows canvas', async ({ page }) => {
    await page.goto('/');

    // Find the file input and upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    // Wait for canvas to render (React Flow viewport)
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });
  });

  test('canvas renders VPC node after upload', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });

    // Check that at least one VPC node is rendered
    await expect(page.getByText('main-vpc')).toBeVisible({ timeout: 5_000 });
  });

  test('canvas renders multiple resource types', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10_000 });

    // Verify key resources are present
    await expect(page.getByText('web-server')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('postgres-db')).toBeVisible();
    await expect(page.getByText('app-alb')).toBeVisible();
  });
});
