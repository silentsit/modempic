import { test, expect } from "@playwright/test";

test.describe("Nootropics catalog (browser)", () => {
  test("nootropics category page renders compare links and product grid", async ({ page }) => {
    await page.goto("/shop/nootropics");
    await expect(page.getByRole("heading", { name: /nootropics/i }).first()).toBeVisible();
    await expect(page.getByRole("term", { name: /^Products$/i })).toBeVisible();
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  });

  test("nootropics PDP shows catalog tabs", async ({ page }) => {
    await page.goto("/shop/nootropics");
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

  test("empty checkout sends guests to the cart instead of a sign-in wall", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();
  });
});

test.describe("Admin orders (browser)", () => {
  test("admin orders redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/login/);
  });
});
