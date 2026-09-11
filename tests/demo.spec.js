import { test, expect } from "@playwright/test";

test("booking, supplier pricing, tracking progression and cancellation", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "اطلب الآن", exact: true }).click();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await expect(
    page.getByPlaceholder("اسم الشارع، رقم المنزل، وأقرب معلم"),
  ).toBeVisible();
  await page
    .getByPlaceholder("اسم الشارع، رقم المنزل، وأقرب معلم")
    .fill("شارع الأمير سعود، منزل ٢٤");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByText("12 طن", { exact: true }).click();
  await page.getByLabel("نوع الماء").selectOption("شرب");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await expect(page.locator(".order-suppliers .supplier-card")).toHaveCount(4);
  await page
    .locator(".supplier-card")
    .filter({ hasText: "وايت الخير" })
    .getByRole("button")
    .click();
  await expect(
    page.getByRole("heading", { name: "اختر موردك بكل ثقة" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await expect(page.locator(".total-row")).toContainText("230 ر.س");
  await page.getByText("بطاقة (تجريبي)", { exact: true }).click();
  await page.getByRole("button", { name: "تأكيد الطلب", exact: true }).click();
  await expect(page).toHaveURL(/tracking/);
  await expect(page.getByText("محمد العتيبي", { exact: false })).toBeVisible();
  for (let i = 0; i < 4; i++)
    await page
      .getByRole("button", { name: "محاكاة: الانتقال للحالة التالية" })
      .click();
  await expect(
    page.getByRole("heading", { name: "وصلت الموية، بالعافية!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "إلغاء الطلب التجريبي" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "اطلب مرة ثانية" }).click();
  await page
    .getByPlaceholder("اسم الشارع، رقم المنزل، وأقرب معلم")
    .fill("شارع الملك سلمان، منزل ١٢");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("button", { name: "تأكيد الطلب", exact: true }).click();
  await page.getByRole("button", { name: "إلغاء الطلب التجريبي" }).click();
  await page.getByRole("button", { name: "نعم، إلغاء الطلب" }).click();
  await expect(
    page.getByRole("heading", { name: "تم إلغاء الطلب" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("dashboard availability, accept, reject and completion update totals", async ({
  page,
}) => {
  await page.goto("/#/dashboard");
  await page.getByRole("checkbox").uncheck();
  await expect(
    page.getByRole("button", { name: "قبول", exact: true }).first(),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "قبول", exact: true }).first().click();
  await page.getByRole("button", { name: "رفض طلب نورة الدوسري" }).click();
  await page.getByRole("button", { name: "تأكيد التسليم" }).click();
  await expect(
    page.locator(".stat-card").filter({ hasText: "إيرادات اليوم" }),
  ).toContainText("540");
  await expect(
    page.locator(".stat-card").filter({ hasText: "طلبات مكتملة اليوم" }),
  ).toContainText("3");
  await expect(
    page.locator(".stat-card").filter({ hasText: "طلبات جديدة" }),
  ).toContainText("1");
});

test("mobile navigation, schedule validation and page layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await page
    .getByRole("navigation", { name: "التنقل الرئيسي" })
    .getByRole("button", { name: "تتبع الطلب" })
    .click();
  await expect(
    page.getByRole("heading", { name: "طلبك القادم يبدأ هنا" }),
  ).toBeVisible();
  await page
    .locator("main")
    .getByRole("button", { name: "اطلب وايت الآن" })
    .click();
  await page
    .getByRole("combobox", { name: "المدينة", exact: true })
    .selectOption("جدة");
  await expect(
    page.getByRole("combobox", { name: "الحي", exact: true }),
  ).toHaveValue("الصفا");
  await page
    .getByPlaceholder("اسم الشارع، رقم المنزل، وأقرب معلم")
    .fill("شارع التحلية، منزل ١٥");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByLabel("وقت التوصيل").selectOption("later");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await expect(page.getByLabel("موعد التوصيل")).toBeVisible();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  await page.getByLabel("موعد التوصيل").fill(tomorrow);
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await expect(page.locator(".order-suppliers .supplier-card")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/#/dashboard");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
