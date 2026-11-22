import { Droplets } from "lucide-react";
import Field from "../Field";
import { CAPACITIES, DELIVERY_TIMES, WATER_TYPES } from "../../lib/labels";

// The earliest time the browser picker allows: now + 5 minutes, local time.
function minScheduleValue() {
  const local = Date.now() + 5 * 60000 - new Date().getTimezoneOffset() * 60000;
  return new Date(local).toISOString().slice(0, 16);
}

// Order step 2: tanker size, water type, delivery time, and notes.
export default function DetailsStep({ form, errors, update }) {
  return (
    <>
      <fieldset>
        <legend>حجم الوايت</legend>
        <div className="choice-grid">
          {CAPACITIES.map((n) => (
            <label
              className={`choice ${form.capacity_tons === n ? "selected" : ""}`}
              key={n}
            >
              <input
                type="radio"
                name="capacity_tons"
                checked={form.capacity_tons === n}
                onChange={() => update("capacity_tons", n)}
              />
              <Droplets size={25} />
              <strong>{n} طن</strong>
              <span>{(n * 1000).toLocaleString("en")} لتر تقريباً</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-grid">
        <Field
          label="نوع الماء"
          name="water_type"
          as="select"
          hint="سعر مياه الشرب يختلف حسب المورد."
          value={form.water_type}
          onChange={(e) => update("water_type", e.target.value)}
        >
          {Object.entries(WATER_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Field>
        <Field
          label="وقت التوصيل"
          name="delivery_time"
          as="select"
          value={form.delivery_time}
          onChange={(e) => update("delivery_time", e.target.value)}
        >
          {Object.entries(DELIVERY_TIMES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Field>
      </div>
      {form.delivery_time === "scheduled" && (
        <Field
          label="موعد التوصيل"
          name="scheduled_at"
          type="datetime-local"
          hint="خلال 7 أيام من الآن."
          min={minScheduleValue()}
          value={form.schedule}
          error={errors.scheduled_at}
          onChange={(e) => update("schedule", e.target.value)}
        />
      )}
      <Field
        label="ملاحظات للمورد"
        name="notes"
        as="textarea"
        optional
        rows="3"
        maxLength={300}
        placeholder="مثلاً: الخزان أرضي، يرجى الاتصال قبل الوصول"
        value={form.notes}
        error={errors.notes}
        onChange={(e) => update("notes", e.target.value)}
      />
    </>
  );
}
