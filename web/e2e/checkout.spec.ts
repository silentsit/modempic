import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/auth";

const E2E_PRODUCT_SLUG = "e2e-checkout-product";

async function fillCheckoutAddress(page: import("@playwright/test").Page) {
  await page.locator("#billFirstName").fill("Test");
  await page.locator("#billLastName").fill("Customer");
  await page.locator("#billLine1").fill("123 Research Way");
  await page.locator("#billCity").fill("Austin");
  await page.locator("#billState").selectOption("TX");
  await page.locator("#billPostal").fill("78701");
}

test.describe("authenticated checkout", () => {
  test.setTimeout(120_000);

  test("simulated crypto checkout completes to confirmation", async ({ page }) => {
    await loginAsCustomer(page, `/checkout?buy=${E2E_PRODUCT_SLUG}`);
    await expect(page.getByRole("heading", { name: /complete your order/i })).toBeVisible();

    await fillCheckoutAddress(page);
    await page.getByRole("button", { name: /pay with crypto/i }).click();

    await page.waitForURL(/\/order\/MP-.*\/confirmation/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /thanks for your order/i })).toBeVisible();
    await expect(page.getByText(/simulator/i)).toBeVisible();

    await page.getByRole("button", { name: /mark crypto payment as received/i }).click();
    await expect(page.getByText(/COMPLETED|completed/i)).toBeVisible({ timeout: 30_000 });
  });

  test("coupon preview applies WELCOME10 discount", async ({ page }) => {
    await loginAsCustomer(page, `/checkout?buy=${E2E_PRODUCT_SLUG}`);

    const couponInput = page.locator("#couponCode");
    await couponInput.fill("WELCOME10");
    await couponInput.blur();

    await expect(page.getByText(/promo applied/i)).toBeVisible({ timeout: 20_000 });
  });
});
