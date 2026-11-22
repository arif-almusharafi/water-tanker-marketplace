import { test, expect } from "@playwright/test";
import { createFakeApi, makeSupplier } from "./fake-api.js";

const ADDRESS = "شارع الأمير سعود، منزل ٢٤";
const next = (page) =>
  page.getByRole("button", { name: "التالي", exact: true }).click();

// Fills order step 1 with valid values.
async function fillLocation(page, phone = "0551234567") {
  await page.getByPlaceholder("اسم الشارع، رقم المنزل، وأقرب معلم").fill(ADDRESS);
  await page.getByLabel("اسمك").fill("أحمد العتيبي");
  await page.getByLabel("رقم الجوال").fill(phone);
}

test("home lists suppliers from the API with 6 ton prices", async ({ page }) => {
  const api = createFakeApi({
    suppliers: [makeSupplier(1), makeSupplier(2), makeSupplier(3), makeSupplier(4)],
  });
  await api.install(page);
  await page.goto("/");
  const cards = page.locator("#suppliers .supplier-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText("مورد 1");
  await expect(cards.first()).toContainText("110"); // prices_sar["6"]
  await expect(cards.first()).toContainText("مورد جديد");
  await expect(page.getByText("موردون متاحون الآن: 4")).toBeVisible();
  await expect(page.getByText("نسخة أولى")).toBeVisible();
});

test("order: validation, supplier price, confirm, track, and cancel", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const api = createFakeApi({ suppliers: [makeSupplier(1), makeSupplier(2)] });
  await api.install(page);
  await page.goto("/");
  await page.getByRole("button", { name: "اطلب الآن", exact: true }).click();

  // Empty step 1 shows Arabic errors under the fields.
  await next(page);
  await expect(page.getByText("العنوان لازم يكون بين 8 و 200 حرف")).toBeVisible();
  await expect(page.getByText("رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام")).toBeVisible();

  // Arabic-Indic digits are turned into 0-9.
  await fillLocation(page, "٠٥٥١٢٣٤٥٦٧");
  await expect(page.getByLabel("رقم الجوال")).toHaveValue("0551234567");
  await next(page);

  await page.getByText("12 طن", { exact: true }).click();
  await page.getByLabel("نوع الماء").selectOption("drinking");
  await next(page);

  await expect(page.locator(".order-suppliers .supplier-card")).toHaveCount(2);
  const second = page.locator(".supplier-card").filter({ hasText: "مورد 2" });
  await expect(second).toContainText("230"); // 200 + 30 drinking extra
  await second.getByRole("button").click();
  await next(page);

  await expect(page.locator(".total-row")).toContainText("230 ر.س");
  await page.getByText("شبكة / مدى عند الاستلام", { exact: true }).click();
  await page.getByRole("button", { name: "تأكيد الطلب", exact: true }).click();

  await expect(page).toHaveURL(/#\/tracking\?ref=MW-TEST0001/);
  const sent = api.state.requests.find((r) => r.path === "/api/orders");
  expect(sent.body).toMatchObject({
    supplier_id: 2,
    customer_phone: "0551234567",
    city_id: "riyadh",
    district_id: "al-narjis",
    capacity_tons: 12,
    water_type: "drinking",
    delivery_time: "asap",
    scheduled_at: null,
    payment_method: "card",
  });
  await expect(page.getByText("230 ر.س")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("mooyah_last_order"))).toBe(
    "MW-TEST0001",
  );
  // Before the supplier accepts, there is no phone to call.
  await expect(page.getByRole("button", { name: "اتصال بالسائق" })).toBeDisabled();

  // The supplier accepts: after a refresh, the call link uses the supplier phone.
  api.state.orders[0].status = "accepted";
  await page.reload();
  await expect(page.locator(".tracking-heading .available")).toHaveText("وافق المورد");
  await expect(page.getByRole("link", { name: "اتصال بالسائق" })).toHaveAttribute(
    "href",
    "tel:0500000002",
  );

  await page.getByRole("button", { name: "إلغاء الطلب" }).click();
  await page.getByRole("button", { name: "نعم، إلغاء الطلب" }).click();
  await expect(page.getByRole("heading", { name: "تم إلغاء الطلب" })).toBeVisible();
  await expect(page.getByRole("button", { name: "اطلب مرة ثانية" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("cancel after the tanker left shows the server error", async ({ page }) => {
  const api = createFakeApi({ suppliers: [makeSupplier(1)] });
  await api.install(page);
  await page.goto("/#/order");
  await fillLocation(page);
  for (let i = 0; i < 3; i++) await next(page);
  await page.getByRole("button", { name: "تأكيد الطلب", exact: true }).click();
  await expect(page).toHaveURL(/tracking/);
  api.state.orders[0].status = "on_the_way"; // changed after the page loaded
  await page.getByRole("button", { name: "إلغاء الطلب" }).click();
  await page.getByRole("button", { name: "نعم، إلغاء الطلب" }).click();
  await expect(page.getByRole("alert")).toContainText("ما يمكن إلغاء الطلب");
  await expect(page.locator(".tracking-heading .available")).toHaveText("الوايت في الطريق");
});

test("scheduled time in the past is refused in Arabic", async ({ page }) => {
  const api = createFakeApi({ suppliers: [makeSupplier(1)] });
  await api.install(page);
  await page.goto("/#/order");
  await fillLocation(page);
  await next(page);
  await page.getByLabel("وقت التوصيل").selectOption("scheduled");
  await page.getByLabel("موعد التوصيل").fill("2020-01-01T10:00");
  await next(page);
  await expect(page.getByText("الموعد لازم يكون بعد الآن وخلال 7 أيام")).toBeVisible();
});

test("empty database: Arabic empty states and no way past step 3", async ({ page }) => {
  const api = createFakeApi();
  await api.install(page);
  await page.goto("/");
  await expect(page.getByText("لا يوجد موردون متاحون في الرياض حالياً")).toBeVisible();

  await page.goto("/#/order");
  await page.getByRole("combobox", { name: "المدينة", exact: true }).selectOption("jeddah");
  await expect(page.getByRole("combobox", { name: "الحي", exact: true })).toHaveValue("al-safa");
  await fillLocation(page);
  await next(page);
  await next(page);
  await expect(page.getByText("لا يوجد موردون متاحون في جدة حالياً")).toBeVisible();
  await expect(page.getByRole("button", { name: "التالي", exact: true })).toBeDisabled();

  await page.goto("/#/tracking");
  await expect(page.getByRole("heading", { name: "طلبك القادم يبدأ هنا" })).toBeVisible();
  await page.getByLabel("رقم الطلب").fill("mw-nothere1");
  await page.getByRole("button", { name: "عرض الطلب" }).click();
  await expect(page).toHaveURL(/ref=MW-NOTHERE1/);
  await expect(page.getByRole("heading", { name: "ما لقينا طلب بهذا الرقم" })).toBeVisible();
});

test("API down: error message and a retry button", async ({ page }) => {
  const api = createFakeApi({ suppliers: [makeSupplier(1)], down: true });
  await api.install(page);
  await page.goto("/");
  await expect(page.getByText("تعذر الاتصال بالخادم، حاول مرة ثانية")).toBeVisible();
  api.state.down = false;
  await page.getByRole("button", { name: "إعادة المحاولة" }).click();
  await expect(page.locator("#suppliers .supplier-card")).toHaveCount(1);
});
