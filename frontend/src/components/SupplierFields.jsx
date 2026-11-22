import Field from "./Field";
import { cleanNumber } from "../lib/format";

// The profile and price fields of a supplier.
// Used by the register page and by the "بياناتي وأسعاري" dashboard panel.
// `update(key, value)` changes one form value.
export default function SupplierFields({ form, errors, update }) {
  // Number inputs: Western digits only, left to right like on a phone keypad.
  const numberProps = (key) => ({
    dir: "ltr",
    inputMode: "numeric",
    value: form[key],
    error: errors[key],
    onChange: (e) => update(key, cleanNumber(e.target.value)),
  });

  return (
    <>
      <div className="form-grid">
        <Field
          label="اسم المؤسسة"
          name="name"
          autoComplete="organization"
          maxLength={60}
          value={form.name}
          error={errors.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <Field
          label="وصف قصير"
          name="tagline"
          optional
          maxLength={80}
          placeholder="مثلاً: موية نقية لبيتك"
          value={form.tagline}
          error={errors.tagline}
          onChange={(e) => update("tagline", e.target.value)}
        />
        <Field
          label="اسم السائق"
          name="driver_name"
          optional
          maxLength={60}
          value={form.driver_name}
          error={errors.driver_name}
          onChange={(e) => update("driver_name", e.target.value)}
        />
        <Field
          label="وقت الوصول المعتاد (دقيقة)"
          name="eta_minutes"
          hint="من 10 إلى 240 دقيقة"
          {...numberProps("eta_minutes")}
        />
      </div>
      <fieldset>
        <legend>أسعارك بالريال، شاملة الضريبة</legend>
        <div className="price-grid">
          <Field label="وايت ٦ طن" name="price_6" {...numberProps("price_6")} />
          <Field label="وايت ١٢ طن" name="price_12" {...numberProps("price_12")} />
          <Field label="وايت ١٨ طن" name="price_18" {...numberProps("price_18")} />
          <Field
            label="إضافة مياه الشرب"
            name="drinking_extra_sar"
            {...numberProps("drinking_extra_sar")}
          />
        </div>
      </fieldset>
    </>
  );
}
