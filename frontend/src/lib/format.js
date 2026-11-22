// Small pure helpers. They have no React code, so they are easy to test.

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

// Turns Arabic-Indic digits (٠-٩) into 0-9.
export function toWesternDigits(text) {
  return String(text).replace(/[٠-٩]/g, (d) => ARABIC_DIGITS.indexOf(d));
}

// Phone as the API wants it: Western digits and no spaces.
export function cleanPhone(text) {
  return toWesternDigits(text).replace(/\s+/g, "");
}

// A whole number typed by the user, or "" while the field is empty.
export function cleanNumber(text) {
  return toWesternDigits(text).replace(/[^0-9]/g, "");
}

export const isValidPhone = (phone) => /^05[0-9]{8}$/.test(phone);

// Same rule as the server: size price + drinking extra.
export function supplierPrice(supplier, capacity, waterType) {
  const base = supplier.prices_sar[String(capacity)];
  return base + (waterType === "drinking" ? supplier.drinking_extra_sar : 0);
}

// "25–35 دقيقة" from the supplier's typical arrival time.
export const etaRange = (minutes) => `${minutes}–${minutes + 10} دقيقة`;

// The card color comes from the supplier id, so it never changes.
export const supplierColor = (id) => ["blue", "cyan", "navy"][id % 3];

// Date and time in Arabic, shown in Saudi time.
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Weekday name for a "YYYY-MM-DD" date from the stats endpoint.
export function weekdayName(date) {
  return new Date(`${date}T12:00:00+03:00`).toLocaleDateString("ar-SA", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
  });
}

// Reads one value from the query part of the hash, e.g. "#/tracking?ref=MW-1".
export function hashParam(name) {
  const query = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(query).get(name);
}
