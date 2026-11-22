import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Droplets, MapPin, Wallet } from "lucide-react";
import { Button } from "../components/UI";
import { ErrorState, LoadingState } from "../components/States";
import LocationStep from "../components/order/LocationStep";
import DetailsStep from "../components/order/DetailsStep";
import SupplierStep from "../components/order/SupplierStep";
import SummaryStep from "../components/order/SummaryStep";
import { createOrder, getSuppliers } from "../api";
import { useApi } from "../lib/useApi";
import { validateOrderStep } from "../lib/validation";
import { focusFirstError } from "../lib/focus";

const STEP_NAMES = ["موقع التوصيل", "تفاصيل الوايت", "اختيار المورد", "تأكيد الطلب"];
const STEP_TITLES = [
  "وين نوصّل طلبك؟",
  "اختر الوايت المناسب",
  "اختر موردك بكل ثقة",
  "كل شيء جاهز؟",
];
const STEP_TEXTS = [
  "حدد عنوانك عشان يوصل الوايت بسهولة.",
  "أخبرنا باحتياجك ونضبط لك الخيارات.",
  "الأسعار المعروضة تشمل الضريبة.",
  "راجع التفاصيل قبل تأكيد طلبك.",
];

// Which step shows each field, so a server error opens the right step.
const FIELD_STEP = {
  city_id: 0,
  district_id: 0,
  address: 0,
  customer_name: 0,
  customer_phone: 0,
  capacity_tons: 1,
  water_type: 1,
  delivery_time: 1,
  scheduled_at: 1,
  notes: 1,
  supplier_id: 2,
  payment_method: 3,
};

// Supplier errors send the customer back to choose another supplier.
const SUPPLIER_ERRORS = ["supplier_unavailable", "supplier_not_found", "supplier_other_city"];

// `cities` is the API state from App. `city` is the city id chosen on Home.
export default function Order({ cities, city, initialSupplier, onConfirm, navigate }) {
  if (cities.error)
    return (
      <main className="container page-shell order-page">
        <ErrorState error={cities.error} onRetry={cities.reload} />
      </main>
    );
  if (!cities.data)
    return (
      <main className="container page-shell order-page">
        <LoadingState />
      </main>
    );
  return (
    <OrderForm
      cities={cities.data}
      startCity={city || cities.data[0].id}
      initialSupplier={initialSupplier}
      onConfirm={onConfirm}
      navigate={navigate}
    />
  );
}

function OrderForm({ cities, startCity, initialSupplier, onConfirm, navigate }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    city_id: startCity,
    district_id: "", // empty means "the first district of the city"
    address: "",
    customer_name: "",
    customer_phone: "",
    capacity_tons: 6,
    water_type: "regular",
    delivery_time: "asap",
    schedule: "", // the datetime-local value, in the browser's time
    notes: "",
    payment_method: "cash",
  });
  const [supplierId, setSupplierId] = useState(initialSupplier?.id ?? null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  const city = cities.find((c) => c.id === form.city_id) || cities[0];
  const district =
    city.districts.find((d) => d.id === form.district_id) || city.districts[0];
  const suppliers = useApi(() => getSuppliers(city.id), [city.id]);
  // Keep the chosen supplier if it is in this city's list, else the first one.
  const list = suppliers.data || [];
  const chosen = list.find((s) => s.id === supplierId) || list[0] || null;

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  // A new city starts again at its first district.
  const changeCity = (id) => setForm((f) => ({ ...f, city_id: id, district_id: "" }));

  function goTo(next) {
    if (next === 2) suppliers.reload(); // fresh list: a supplier may be busy now
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showErrors(found, atStep) {
    setErrors(found);
    if (atStep !== step) setStep(atStep);
    focusFirstError(formRef.current);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitError("");
    if (step < 3) {
      const found = validateOrderStep(step, form);
      if (Object.keys(found).length) return showErrors(found, step);
      setErrors({});
      return goTo(step + 1);
    }
    // The scheduled time may have passed while the customer was on step 4.
    const late = validateOrderStep(1, form);
    if (Object.keys(late).length) return showErrors(late, 1);
    await send();
  }

  async function send() {
    setBusy(true);
    try {
      const order = await createOrder({
        supplier_id: chosen.id,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone,
        city_id: city.id,
        district_id: district.id,
        address: form.address.trim(),
        capacity_tons: form.capacity_tons,
        water_type: form.water_type,
        delivery_time: form.delivery_time,
        scheduled_at:
          form.delivery_time === "scheduled"
            ? new Date(form.schedule).toISOString()
            : null,
        notes: form.notes.trim() || null,
        payment_method: form.payment_method,
      });
      onConfirm(order);
    } catch (error) {
      setBusy(false);
      setSubmitError(error.message);
      if (SUPPLIER_ERRORS.includes(error.code)) return goTo(2);
      const steps = Object.keys(error.fields || {})
        .map((key) => FIELD_STEP[key])
        .filter((s) => s !== undefined);
      if (steps.length) showErrors(error.fields, Math.min(...steps));
    }
  }

  return (
    <main className="container page-shell order-page">
      <div className="page-intro">
        <span className="eyebrow">موية على قد احتياجك</span>
        <h1>خلّنا نوصل الموية لبابك</h1>
        <p>خطوات بسيطة، وراحتك علينا.</p>
      </div>
      <ol className="order-steps">
        {STEP_NAMES.map((s, i) => (
          <li
            key={s}
            className={i <= step ? "active" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={18} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <form ref={formRef} onSubmit={submit} noValidate>
        <div className="form-panel">
          <div className="panel-title">
            <span className="soft-icon">
              {step === 0 ? <MapPin /> : step === 3 ? <Wallet /> : <Droplets />}
            </span>
            <div>
              <h2>{STEP_TITLES[step]}</h2>
              <p>{STEP_TEXTS[step]}</p>
            </div>
          </div>
          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}
          {step === 0 && (
            <LocationStep
              cities={cities}
              city={city}
              district={district}
              form={form}
              errors={errors}
              update={update}
              changeCity={changeCity}
            />
          )}
          {step === 1 && <DetailsStep form={form} errors={errors} update={update} />}
          {step === 2 && (
            <SupplierStep
              suppliers={suppliers}
              chosen={chosen}
              choose={setSupplierId}
              form={form}
              cityName={city.name}
              onJoin={() => navigate("supplier/register")}
            />
          )}
          {step === 3 && chosen && (
            <SummaryStep
              form={form}
              city={city}
              district={district}
              supplier={chosen}
              update={update}
            />
          )}
        </div>
        <div className="form-actions">
          {step > 0 ? (
            <Button type="button" secondary onClick={() => goTo(step - 1)}>
              <ArrowRight size={18} /> السابق
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={busy || (step >= 2 && !chosen)}>
            {busy ? (
              <>
                <span className="spinner" /> جارٍ تأكيد الطلب…
              </>
            ) : step === 3 ? (
              <>
                تأكيد الطلب <Check size={18} />
              </>
            ) : (
              <>
                التالي <ArrowLeft size={18} />
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}
