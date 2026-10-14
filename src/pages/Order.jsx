import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Droplets,
  LockKeyhole,
  MapPin,
  Wallet,
} from "lucide-react";
import { Button, MapPreview, SupplierCard } from "../components/UI";
import { cities, formatSchedule, getPrice, suppliers } from "../data/mock";
export default function Order({ city, initialSupplier, onConfirm }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    city,
    area: cities[city][0],
    address: "",
    capacity: 6,
    water: "عادية",
    time: "now",
    schedule: "",
    notes: "",
    payment: "نقداً عند الاستلام",
  });
  const [supplier, setSupplier] = useState(initialSupplier || suppliers[0]);
  const [busy, setBusy] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const confirmTimer = useRef(null);
  useEffect(() => () => clearTimeout(confirmTimer.current), []);
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const price = getPrice(supplier, form.capacity, form.water);
  function submit(e) {
    e.preventDefault();
    // The input's min only applies on step 1; time may pass before confirming.
    if (
      step >= 1 &&
      form.time === "later" &&
      new Date(form.schedule).getTime() <= Date.now()
    ) {
      setScheduleError("اختر موعداً في المستقبل.");
      setStep(1);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setBusy(true);
      confirmTimer.current = window.setTimeout(
        () =>
          onConfirm({
            ...form,
            supplier,
            price,
            id: `MW-${Date.now().toString().slice(-7)}`,
            status: 0,
            cancelled: false,
          }),
        650,
      );
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
        {["موقع التوصيل", "تفاصيل الوايت", "اختيار المورد", "تأكيد الطلب"].map(
          (s, i) => (
            <li
              key={s}
              className={i <= step ? "active" : ""}
              aria-current={i === step ? "step" : undefined}
            >
              <span>{i < step ? <Check size={18} /> : i + 1}</span>
              {s}
            </li>
          ),
        )}
      </ol>
      <form onSubmit={submit}>
        <div className="form-panel">
          <div className="panel-title">
            <span className="soft-icon">
              {step === 0 ? <MapPin /> : step === 3 ? <Wallet /> : <Droplets />}
            </span>
            <div>
              <h2>
                {
                  [
                    "وين نوصّل طلبك؟",
                    "اختر الوايت المناسب",
                    "اختر موردك بكل ثقة",
                    "كل شيء جاهز؟",
                  ][step]
                }
              </h2>
              <p>
                {
                  [
                    "حدد عنوانك عشان يوصل الوايت بسهولة.",
                    "أخبرنا باحتياجك ونضبط لك الخيارات.",
                    "الأسعار المعروضة تشمل الضريبة.",
                    "راجع التفاصيل قبل تأكيد طلبك التجريبي.",
                  ][step]
                }
              </p>
            </div>
          </div>
          {step === 0 && (
            <>
              <div className="form-grid">
                <label>
                  المدينة
                  <select
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        city: e.target.value,
                        area: cities[e.target.value][0],
                      }))
                    }
                  >
                    {Object.keys(cities).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  الحي
                  <select
                    value={form.area}
                    onChange={(e) => update("area", e.target.value)}
                  >
                    {cities[form.city].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                العنوان بالتفصيل
                <input
                  required
                  minLength={8}
                  maxLength={200}
                  placeholder="اسم الشارع، رقم المنزل، وأقرب معلم"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </label>
              <MapPreview area={form.area} />
              <p className="muted small">
                موقع توضيحي فقط. سنستخدم العنوان المكتوب في ملخص الطلب.
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <fieldset>
                <legend>حجم الوايت</legend>
                <div className="choice-grid">
                  {[6, 12, 18].map((n) => (
                    <label
                      className={`choice ${form.capacity === n ? "selected" : ""}`}
                      key={n}
                    >
                      <input
                        type="radio"
                        name="capacity"
                        checked={form.capacity === n}
                        onChange={() => update("capacity", n)}
                      />
                      <Droplets size={25} />
                      <strong>{n} طن</strong>
                      <span>{(n * 1000).toLocaleString("en")} لتر تقريباً</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="form-grid">
                <label>
                  نوع الماء
                  <select
                    value={form.water}
                    onChange={(e) => update("water", e.target.value)}
                  >
                    <option value="عادية">مياه عادية</option>
                    <option value="شرب">مياه شرب (+٣٠ ر.س)</option>
                  </select>
                </label>
                <label>
                  وقت التوصيل
                  <select
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                  >
                    <option value="now">في أقرب وقت</option>
                    <option value="later">جدولة لوقت لاحق</option>
                  </select>
                </label>
              </div>
              {form.time === "later" && (
                <label>
                  موعد التوصيل
                  <input
                    type="datetime-local"
                    required
                    min={new Date(
                      Date.now() +
                        60000 -
                        new Date().getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)}
                    value={form.schedule}
                    aria-invalid={scheduleError ? true : undefined}
                    onChange={(e) => {
                      update("schedule", e.target.value);
                      setScheduleError("");
                    }}
                  />
                  {scheduleError && (
                    <small className="field-error" role="alert">
                      {scheduleError}
                    </small>
                  )}
                </label>
              )}
              <label>
                ملاحظات للمورد <span className="muted">(اختياري)</span>
                <textarea
                  rows="3"
                  placeholder="مثلاً: الخزان أرضي، يرجى الاتصال قبل الوصول"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </label>
            </>
          )}
          {step === 2 && (
            <div className="order-suppliers">
              {suppliers.map((s) => (
                <SupplierCard
                  key={s.id}
                  supplier={s}
                  selected={supplier.id === s.id}
                  price={getPrice(s, form.capacity, form.water)}
                  onSelect={(s) => setSupplier(s)}
                />
              ))}
            </div>
          )}
          {step === 3 && (
            <>
              <dl className="summary-list">
                <div>
                  <dt>عنوان التوصيل</dt>
                  <dd>
                    {form.city}، {form.area}
                    <small>{form.address}</small>
                  </dd>
                </div>
                <div>
                  <dt>حجم الوايت / نوع الماء</dt>
                  <dd>
                    {form.capacity} طن · مياه {form.water}
                  </dd>
                </div>
                <div>
                  <dt>المورد</dt>
                  <dd>{supplier.name}</dd>
                </div>
                <div>
                  <dt>وقت التوصيل</dt>
                  <dd>
                    {form.time === "now"
                      ? `خلال ${supplier.eta}–${supplier.eta + 10} دقيقة`
                      : formatSchedule(form.schedule)}
                  </dd>
                </div>
                {form.notes && (
                  <div>
                    <dt>ملاحظات</dt>
                    <dd>{form.notes}</dd>
                  </div>
                )}
                <div className="total-row">
                  <dt>الإجمالي شامل الضريبة</dt>
                  <dd>{price} ر.س</dd>
                </div>
              </dl>
              <fieldset>
                <legend>طريقة الدفع التجريبية</legend>
                <div className="payment-options">
                  {[
                    [Wallet, "نقداً عند الاستلام"],
                    [CreditCard, "بطاقة (تجريبي)"],
                  ].map(([Icon, name]) => (
                    <label
                      key={name}
                      className={`payment-choice ${form.payment === name ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={form.payment === name}
                        onChange={() => update("payment", name)}
                      />
                      <Icon size={22} />
                      {name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="demo-notice">
                <LockKeyhole size={17} /> طلب تجريبي فقط. لن يتم خصم أي مبلغ أو
                إرسال وايت فعلي.
              </p>
            </>
          )}
        </div>
        <div className="form-actions">
          {step > 0 ? (
            <Button type="button" secondary onClick={() => setStep(step - 1)}>
              <ArrowRight size={18} /> السابق
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={busy}>
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
