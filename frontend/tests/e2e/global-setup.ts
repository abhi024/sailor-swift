import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Launch browser and clear all cookies before running tests
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: config.projects[0].use.baseURL,
  });

  // Clear all cookies
  await context.clearCookies();

  await context.close();
  await browser.close();
}

export default globalSetup;
