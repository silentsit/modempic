import { test, expect } from "@playwright/test";

test.describe("Modafinil catalog (browser)", () => {
  test("modafinil category page renders compare links and product grid", async ({ page }) => {
    await page.goto("/shop/modafinil");
    await expect(page.getByRole("heading", { name: /modafinil/i }).first()).toBeVisible();
    await expect(page.getByText(/compare in this category/i)).toBeVisible();
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  });

  test("modafinil PDP shows catalog tabs", async ({ page }) => {
    await page.goto("/shop/modafinil");
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible();
    const href = await productLink.getAttribute("href");
    test.skip(!href, "No modafinil products in catalog");

    await page.goto(href!);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("tab", { name: /description/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /specs|shipping|faq/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /reviews/i })).toBeVisible();
  });

  test("checkout page shows sign-in gate for guests", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText(/sign in to finish|create account/i)).toBeVisible();
  });
});

test.describe("Admin orders (browser)", () => {
  test("admin orders redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/login/);
  });
});
