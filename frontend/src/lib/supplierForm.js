// Turns the supplier form (all text values) into the API body and back.

export function emptySupplierForm() {
  return {
    name: "",
    tagline: "",
    phone: "",
    password: "",
    city_id: "",
    driver_name: "",
    eta_minutes: "30",
    price_6: "",
    price_12: "",
    price_18: "",
    drinking_extra_sar: "30", // Arif's choice: the register form starts at 30
  };
}

// Fills the form from a SupplierPrivate object (for the profile panel).
export function formFromSupplier(s) {
  return {
    ...emptySupplierForm(),
    name: s.name,
    tagline: s.tagline || "",
    driver_name: s.driver_name || "",
    eta_minutes: String(s.eta_minutes),
    price_6: String(s.prices_sar["6"]),
    price_12: String(s.prices_sar["12"]),
    price_18: String(s.prices_sar["18"]),
    drinking_extra_sar: String(s.drinking_extra_sar),
  };
}

// Profile fields as the API wants them. Empty optional text becomes null.
export function profileBody(form) {
  return {
    name: form.name.trim(),
    tagline: form.tagline.trim() || null,
    driver_name: form.driver_name.trim() || null,
    eta_minutes: Number(form.eta_minutes),
    prices_sar: {
      6: Number(form.price_6),
      12: Number(form.price_12),
      18: Number(form.price_18),
    },
    drinking_extra_sar: Number(form.drinking_extra_sar),
  };
}

// Body for POST /api/auth/register.
export function registerBody(form) {
  return {
    ...profileBody(form),
    phone: form.phone,
    password: form.password,
    city_id: form.city_id,
  };
}
