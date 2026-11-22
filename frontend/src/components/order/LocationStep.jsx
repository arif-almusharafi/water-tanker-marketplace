import Field from "../Field";
import { MapPreview } from "../UI";
import { cleanPhone } from "../../lib/format";

// Order step 1: city, district, address, and the customer's name and phone.
export default function LocationStep({ cities, city, district, form, errors, update, changeCity }) {
  return (
    <>
      <div className="form-grid">
        <Field
          label="المدينة"
          name="city_id"
          as="select"
          value={city.id}
          error={errors.city_id}
          onChange={(e) => changeCity(e.target.value)}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Field>
        <Field
          label="الحي"
          name="district_id"
          as="select"
          value={district.id}
          error={errors.district_id}
          onChange={(e) => update("district_id", e.target.value)}
        >
          {city.districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Field>
      </div>
      <Field
        label="العنوان بالتفصيل"
        name="address"
        maxLength={200}
        placeholder="اسم الشارع، رقم المنزل، وأقرب معلم"
        value={form.address}
        error={errors.address}
        onChange={(e) => update("address", e.target.value)}
      />
      <div className="form-grid">
        <Field
          label="اسمك"
          name="customer_name"
          autoComplete="name"
          maxLength={60}
          value={form.customer_name}
          error={errors.customer_name}
          onChange={(e) => update("customer_name", e.target.value)}
        />
        <Field
          label="رقم الجوال"
          name="customer_phone"
          type="tel"
          dir="ltr"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="05XXXXXXXX"
          hint="يظهر رقمك للمورد اللي تختاره فقط."
          value={form.customer_phone}
          error={errors.customer_phone}
          onChange={(e) => update("customer_phone", cleanPhone(e.target.value))}
        />
      </div>
      <MapPreview area={district.name} />
      <p className="muted small">
        موقع توضيحي فقط. سنستخدم العنوان المكتوب في ملخص الطلب.
      </p>
    </>
  );
}
