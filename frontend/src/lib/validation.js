// Checks done in the browser before sending, with the same rules and
// Arabic messages as the API contract. The server checks again.
import { isValidPhone } from "./format";

export const MESSAGES = {
  phone: "رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام",
  password: "كلمة المرور لازم تكون 8 أحرف على الأقل",
  name: "الاسم لازم يكون بين 2 و 60 حرف",
  long: "النص طويل",
  address: "العنوان لازم يكون بين 8 و 200 حرف",
  notes: "الملاحظات طويلة",
  eta: "وقت الوصول لازم يكون بين 10 و 240 دقيقة",
  price: "السعر لازم يكون بين 1 و 5000",
  extra: "المبلغ لازم يكون بين 0 و 1000",
  schedule: "الموعد لازم يكون بعد الآن وخلال 7 أيام",
  city: "المدينة غير موجودة",
};

const lengthBetween = (text, min, max) =>
  text.trim().length >= min && text.trim().length <= max;

const numberBetween = (value, min, max) =>
  value !== "" && Number(value) >= min && Number(value) <= max;

// Supplier profile fields. `withAccount` adds phone, password, and city
// (needed on the register page only).
export function validateSupplier(form, { withAccount = false } = {}) {
  const errors = {};
  if (!lengthBetween(form.name, 2, 60)) errors.name = MESSAGES.name;
  if (form.tagline.trim().length > 80) errors.tagline = MESSAGES.long;
  if (form.driver_name.trim().length > 60) errors.driver_name = MESSAGES.long;
  if (!numberBetween(form.eta_minutes, 10, 240)) errors.eta_minutes = MESSAGES.eta;
  for (const size of ["6", "12", "18"]) {
    if (!numberBetween(form[`price_${size}`], 1, 5000))
      errors[`price_${size}`] = MESSAGES.price;
  }
  if (!numberBetween(form.drinking_extra_sar, 0, 1000))
    errors.drinking_extra_sar = MESSAGES.extra;
  if (withAccount) {
    if (!isValidPhone(form.phone)) errors.phone = MESSAGES.phone;
    if (form.password.length < 8 || form.password.length > 72)
      errors.password = MESSAGES.password;
    if (!form.city_id) errors.city_id = MESSAGES.city;
  }
  return errors;
}

// The scheduled time must be 5 minutes to 7 days from now.
export function isValidSchedule(localValue, now = Date.now()) {
  const time = new Date(localValue).getTime();
  if (Number.isNaN(time)) return false;
  return time >= now + 5 * 60 * 1000 && time <= now + 7 * 24 * 60 * 60 * 1000;
}

// Checks one step of the order form. Step 2 (supplier) and 3 (summary)
// are checked in the Order page itself.
export function validateOrderStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!lengthBetween(form.customer_name, 2, 60))
      errors.customer_name = MESSAGES.name;
    if (!isValidPhone(form.customer_phone)) errors.customer_phone = MESSAGES.phone;
    if (!lengthBetween(form.address, 8, 200)) errors.address = MESSAGES.address;
  }
  if (step === 1) {
    if (form.delivery_time === "scheduled" && !isValidSchedule(form.schedule))
      errors.scheduled_at = MESSAGES.schedule;
    if (form.notes.trim().length > 300) errors.notes = MESSAGES.notes;
  }
  return errors;
}

// The server names price fields "prices_sar.6"; our forms use "price_6".
export function fieldsFromServer(fields = {}) {
  const result = {};
  for (const [key, message] of Object.entries(fields)) {
    result[key.replace(/^prices_sar\.(\d+)$/, "price_$1")] = message;
  }
  return result;
}
