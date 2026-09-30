import { expect, test } from "@playwright/test";

test("home, product, and cart drawer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Everyday objects, considered." })).toBeVisible();
  await page.getByRole("link", { name: "Merino Crew" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Merino Crew" })).toBeVisible();
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await expect(page.getByRole("dialog", { name: "Cart" })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Merino Crew")).toBeVisible();
});

test("empty search and unknown route", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Search the catalog" })).toBeVisible();
  await page.goto("/not-a-real-page");
  await expect(page.getByRole("heading", { name: "This page is not in the catalog." })).toBeVisible();
});
