import { test, expect } from "@playwright/test";
import { createFakeApi, makeSupplier } from "./fake-api.js";

const order = (reference, status, overrides = {}) => ({
  reference,
  status,
  supplier_id: 1,
  customer_name: `عميل ${reference.slice(-1)}`,
  customer_phone: "0551234567",
  city_id: "riyadh",
  city_name: "الرياض",
  district_id: "al-narjis",
  district_name: "النرجس",
  address: "شارع الأمير سلطان، منزل 12",
  capacity_tons: 12,
  water_type: "regular",
  delivery_time: "asap",
  scheduled_at: null,
  notes: null,
  payment_method: "cash",
  price_sar: 200,
  delivered_at: null,
  created_at: "2026-11-22T09:30:00Z",
  updated_at: "2026-11-22T09:30:00Z",
  ...overrides,
});

const tokenIn = (page) =>
  page.evaluate(() => localStorage.getItem("mooyah_supplier_token"));

async function fillRegister(page, phone) {
  await page.getByLabel("رقم الجوال").fill(phone);
  await page.getByLabel("كلمة المرور", { exact: true }).fill("strong-pass-1");
  await page.getByLabel("اسم المؤسسة").fill("مياه الصفا");
  await page.getByLabel("وايت ٦ طن").fill("120");
  await page.getByLabel("وايت ١٢ طن").fill("٢١٠"); // Arabic-Indic digits
  await page.getByLabel("وايت ١٨ طن").fill("300");
}

test("register: phone taken, then success lands on a pending dashboard", async ({ page }) => {
  const api = createFakeApi({ suppliers: [makeSupplier(1)] });
  await api.install(page);
  await page.goto("/");
  await page.locator(".hero-actions").getByRole("button", { name: "انضم كمورد" }).click();
  await expect(page).toHaveURL(/#\/supplier\/register/);

  await fillRegister(page, "0500000001"); // already used by supplier 1
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page.locator("#phone-error")).toHaveText("رقم الجوال مسجل من قبل");

  await page.getByLabel("رقم الجوال").fill("0509998877");
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page).toHaveURL(/#\/dashboard/);
  await expect(
    page.getByText("حسابك قيد المراجعة. بتظهر للعملاء بعد موافقة فريق موية."),
  ).toBeVisible();
  const sent = api.state.requests.findLast((r) => r.path === "/api/auth/register");
  expect(sent.body).toMatchObject({
    phone: "0509998877",
    city_id: "riyadh",
    tagline: null,
    eta_minutes: 30,
    prices_sar: { 6: 120, 12: 210, 18: 300 },
    drinking_extra_sar: 30,
  });
  await expect(page.getByText("ما عندك طلبات جديدة حالياً", { exact: false })).toBeVisible();
});

test("rejected supplier sees the rejected message", async ({ page }) => {
  const api = createFakeApi({
    suppliers: [makeSupplier(1, { approval_status: "rejected" })],
  });
  await api.install(page);
  await page.goto("/#/supplier/login");
  await page.getByLabel("رقم الجوال").fill("0500000001");
  await page.getByLabel("كلمة المرور", { exact: true }).fill("secret-pass");
  await page.getByRole("main").getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByText("لم تتم الموافقة على حسابك. تواصل مع فريق موية.")).toBeVisible();
});

test("login: wrong password, then dashboard actions and logout", async ({ page }) => {
  const api = createFakeApi({
    suppliers: [makeSupplier(1)],
    orders: [order("MW-AAAAAAA1", "pending"), order("MW-AAAAAAA2", "pending")],
  });
  await api.install(page);
  await page.goto("/#/dashboard");
  await expect(page.getByRole("heading", { name: "تسجيل دخول المورد" })).toBeVisible();

  await page.getByLabel("رقم الجوال").fill("0500000001");
  await page.getByLabel("كلمة المرور", { exact: true }).fill("wrong-pass");
  await page.getByRole("main").getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByRole("alert")).toHaveText("رقم الجوال أو كلمة المرور غير صحيحة");
  expect(await tokenIn(page)).toBeNull();

  // A short wrong password is sent too, and shows the same message (QA-1).
  await page.getByLabel("كلمة المرور", { exact: true }).fill("123");
  await page.getByRole("main").getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByRole("alert")).toHaveText("رقم الجوال أو كلمة المرور غير صحيحة");
  const sent = api.state.requests.findLast((r) => r.path === "/api/auth/login");
  expect(sent.body.password).toBe("123");

  await page.getByLabel("كلمة المرور", { exact: true }).fill("secret-pass");
  await page.getByRole("main").getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByRole("heading", { name: "حيّاك الله، مورد 1" })).toBeVisible();
  expect(await tokenIn(page)).toBe("token-1");

  // Availability is saved on the server and keeps its value after a refresh.
  await page.getByRole("checkbox").uncheck();
  await expect(page.getByRole("button", { name: "قبول", exact: true }).first()).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: "قبول", exact: true }).first().click();
  await page.getByRole("button", { name: "رفض طلب عميل 2" }).click();
  await expect(page.locator(".active-delivery")).toHaveCount(1);
  await expect(page.locator(".active-delivery").getByRole("link")).toHaveAttribute(
    "href",
    "tel:0551234567",
  );
  await page.getByRole("button", { name: "في الطريق" }).click();
  await expect(page.locator(".active-delivery .status-chip")).toHaveText("الوايت في الطريق");
  await page.getByRole("button", { name: "تأكيد التسليم" }).click();

  await expect(page.locator(".stat-card").filter({ hasText: "إيرادات اليوم" })).toContainText("200");
  await expect(page.locator(".stat-card").filter({ hasText: "طلبات مكتملة اليوم" })).toContainText("1");
  await expect(page.locator(".history-list")).toContainText("مكتمل");
  await expect(page.locator(".history-list")).toContainText("مرفوض");

  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/#\/$/);
  expect(await tokenIn(page)).toBeNull();
});

test("profile panel saves new prices", async ({ page }) => {
  const api = createFakeApi({ suppliers: [makeSupplier(1)] });
  await api.install(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("mooyah_supplier_token", "token-1"));
  await page.goto("/#/dashboard");
  await page.getByRole("button", { name: "بياناتي وأسعاري" }).click();
  await page.getByLabel("وايت ٦ طن").fill("0");
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await expect(page.locator("#price_6-error")).toHaveText("السعر لازم يكون بين 1 و 5000");
  await page.getByLabel("وايت ٦ طن").fill("135");
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await expect(page.getByText("تم حفظ بياناتك وأسعارك")).toBeVisible();
  expect(api.state.suppliers[0].prices_sar[6]).toBe(135);
});

test("an expired token clears storage and shows the login page", async ({ page }) => {
  const api = createFakeApi({ suppliers: [makeSupplier(1)] });
  await api.install(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("mooyah_supplier_token", "old-token"));
  await page.goto("/#/dashboard");
  await expect(page.getByRole("heading", { name: "تسجيل دخول المورد" })).toBeVisible();
  expect(await tokenIn(page)).toBeNull();
});
