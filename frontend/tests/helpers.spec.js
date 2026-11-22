// Unit tests for the small pure helpers (no browser page needed).
import { test, expect } from "@playwright/test";
import { cleanNumber, cleanPhone, supplierPrice, toWesternDigits } from "../src/lib/format.js";
import { fieldsFromServer, isValidSchedule, validateSupplier } from "../src/lib/validation.js";
import { emptySupplierForm, registerBody } from "../src/lib/supplierForm.js";

test("digits and phone cleaning", () => {
  expect(toWesternDigits("٠٥٥١٢٣")).toBe("055123");
  expect(cleanPhone(" ٠٥٥ ١٢٣ ٤٥٦٧ ")).toBe("0551234567");
  expect(cleanNumber("١٢x3")).toBe("123");
});

test("price = size price + drinking extra", () => {
  const s = { prices_sar: { 6: 120, 12: 210, 18: 300 }, drinking_extra_sar: 30 };
  expect(supplierPrice(s, 12, "regular")).toBe(210);
  expect(supplierPrice(s, 12, "drinking")).toBe(240);
});

test("schedule must be 5 minutes to 7 days ahead", () => {
  const now = new Date("2026-11-22T10:00:00").getTime();
  expect(isValidSchedule("2026-11-22T10:02", now)).toBe(false);
  expect(isValidSchedule("2026-11-22T11:00", now)).toBe(true);
  expect(isValidSchedule("2026-12-01T10:00", now)).toBe(false);
  expect(isValidSchedule("", now)).toBe(false);
});

test("supplier form checks and API body", () => {
  const form = { ...emptySupplierForm(), name: "م" };
  const errors = validateSupplier(form, { withAccount: true });
  expect(Object.keys(errors).sort()).toEqual(
    ["city_id", "name", "password", "phone", "price_12", "price_18", "price_6"].sort(),
  );
  const body = registerBody({
    ...emptySupplierForm(),
    name: " مياه ",
    phone: "0501112233",
    password: "12345678",
    city_id: "riyadh",
    price_6: "1",
    price_12: "2",
    price_18: "3",
  });
  expect(body).toEqual({
    name: "مياه",
    tagline: null,
    driver_name: null,
    eta_minutes: 30,
    prices_sar: { 6: 1, 12: 2, 18: 3 },
    drinking_extra_sar: 30,
    phone: "0501112233",
    password: "12345678",
    city_id: "riyadh",
  });
  expect(fieldsFromServer({ "prices_sar.12": "x", phone: "y" })).toEqual({
    price_12: "x",
    phone: "y",
  });
});
