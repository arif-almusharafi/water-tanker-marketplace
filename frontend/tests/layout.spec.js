import { test, expect } from "@playwright/test";
import { createFakeApi, makeSupplier } from "./fake-api.js";

const noSideScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test("RTL, mobile menu, and no side scroll at 360 px", async ({ page }) => {
  const api = createFakeApi({
    suppliers: [makeSupplier(1), makeSupplier(2), makeSupplier(3)],
    orders: [],
  });
  await api.install(page);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("#suppliers .supplier-card")).toHaveCount(3);
  expect(await noSideScroll(page)).toBe(true);
  await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });

  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await page
    .getByRole("navigation", { name: "التنقل الرئيسي" })
    .getByRole("button", { name: "تتبع الطلب" })
    .click();
  await expect(page.getByRole("heading", { name: "طلبك القادم يبدأ هنا" })).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);

  for (const [hash, heading] of [
    ["#/order", "خلّنا نوصل الموية لبابك"],
    ["#/supplier/register", "انضم كمورد"],
    ["#/supplier/login", "تسجيل دخول المورد"],
  ]) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    expect(await noSideScroll(page)).toBe(true);
  }
  await page.goto("/#/supplier/register");
  await page.screenshot({ path: "test-results/register-mobile.png", fullPage: true });

  // A pending supplier's dashboard on a phone.
  api.state.suppliers.push(makeSupplier(9, { approval_status: "pending" }));
  await page.evaluate(() => localStorage.setItem("mooyah_supplier_token", "token-9"));
  await page.goto("/#/dashboard");
  await expect(page.locator(".approval-banner")).toBeVisible();
  expect(await noSideScroll(page)).toBe(true);
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });
});
