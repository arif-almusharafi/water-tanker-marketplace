import { useRef, useState } from "react";
import { ArrowLeft, Clock3, Truck } from "lucide-react";
import { Button } from "../components/UI";
import Field from "../components/Field";
import PasswordField from "../components/PasswordField";
import SupplierFields from "../components/SupplierFields";
import { ErrorState, LoadingState } from "../components/States";
import { registerSupplier, saveToken } from "../api";
import { cleanPhone } from "../lib/format";
import { emptySupplierForm, registerBody } from "../lib/supplierForm";
import { fieldsFromServer, validateSupplier } from "../lib/validation";
import { focusFirstError } from "../lib/focus";

// New page: #/supplier/register. A new supplier starts "pending" and
// waits for the Mooyah team to approve the account.
export default function SupplierRegister({ cities, navigate, notify }) {
  const [form, setForm] = useState(emptySupplierForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  // Until the user picks a city, use the first one from the API.
  const cityId = form.city_id || cities.data?.[0]?.id || "";

  async function submit(e) {
    e.preventDefault();
    const filled = { ...form, city_id: cityId };
    const found = validateSupplier(filled, { withAccount: true });
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return focusFirstError(formRef.current);

    setBusy(true);
    try {
      const result = await registerSupplier(registerBody(filled));
      saveToken(result.token);
      notify("تم إنشاء حسابك. حسابك الآن قيد المراجعة");
      navigate("dashboard");
    } catch (error) {
      // phone_taken and validation_error both come with `fields`.
      setErrors(fieldsFromServer(error.fields));
      setFormError(error.message);
      setBusy(false);
      focusFirstError(formRef.current);
    }
  }

  return (
    <main className="container page-shell order-page">
      <div className="page-intro">
        <span className="eyebrow">كبّر شغلك مع موية</span>
        <h1>انضم كمورد</h1>
        <p>سجّل بياناتك وأسعارك، ويظهر حسابك للعملاء بعد موافقة فريق موية.</p>
      </div>
      {cities.loading && !cities.data ? (
        <LoadingState />
      ) : cities.error ? (
        <ErrorState error={cities.error} onRetry={cities.reload} />
      ) : (
        <form ref={formRef} onSubmit={submit} noValidate>
          <div className="form-panel">
            <div className="panel-title">
              <span className="soft-icon">
                <Truck />
              </span>
              <div>
                <h2>بيانات حسابك</h2>
                <p>رقم جوالك وكلمة المرور للدخول إلى لوحة المورد.</p>
              </div>
            </div>
            <div className="form-grid">
              <Field
                label="رقم الجوال"
                name="phone"
                type="tel"
                dir="ltr"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="05XXXXXXXX"
                value={form.phone}
                error={errors.phone}
                onChange={(e) => update("phone", cleanPhone(e.target.value))}
              />
              <PasswordField
                autoComplete="new-password"
                hint="8 أحرف على الأقل"
                value={form.password}
                error={errors.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <Field
                label="المدينة"
                name="city_id"
                as="select"
                value={cityId}
                error={errors.city_id}
                onChange={(e) => update("city_id", e.target.value)}
              >
                {cities.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Field>
            </div>
            <SupplierFields form={form} errors={errors} update={update} />
            <p className="demo-notice">
              <Clock3 size={17} aria-hidden="true" /> بعد التسجيل يراجع فريق
              موية حسابك. ما تظهر للعملاء إلا بعد الموافقة.
            </p>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
          </div>
          <div className="form-actions">
            <Button secondary onClick={() => navigate("supplier/login")}>
              عندي حساب، تسجيل الدخول
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" /> جارٍ إنشاء الحساب…
                </>
              ) : (
                <>
                  إنشاء الحساب <ArrowLeft size={18} />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
