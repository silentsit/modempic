import { expect, type Page } from "@playwright/test";

const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? "CustomerDev2025!";

export const E2E_CUSTOMER = {
  email: "customer@modempic.com",
  password: customerPassword,
};

/** Sign in via Auth.js CSRF + credentials callback (stable for Playwright). */
export async function loginAsCustomer(page: Page, callbackUrl = "/checkout") {
  const csrfRes = await page.request.get("/api/auth/csrf");
  expect(csrfRes.ok()).toBeTruthy();
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const loginRes = await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email: E2E_CUSTOMER.email,
      password: E2E_CUSTOMER.password,
      callbackUrl,
    },
  });
  expect(loginRes.ok(), "credentials login should succeed").toBeTruthy();

  await page.goto(callbackUrl);
  await expect(page).not.toHaveURL(/\/login/);
}
