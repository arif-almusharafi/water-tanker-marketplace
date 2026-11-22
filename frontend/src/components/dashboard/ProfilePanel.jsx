import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "../UI";
import SupplierFields from "../SupplierFields";
import { updateMe } from "../../api";
import { formFromSupplier, profileBody } from "../../lib/supplierForm";
import { fieldsFromServer, validateSupplier } from "../../lib/validation";
import { focusFirstError } from "../../lib/focus";

// "بياناتي وأسعاري" (F17): edit name, tagline, driver, arrival time, and prices.
// Phone and city cannot change in v1, so they are shown as plain text.
export default function ProfilePanel({ me, cityName, onSaved, onAuthError }) {
  const [form, setForm] = useState(() => formFromSupplier(me));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    const found = validateSupplier(form);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return focusFirstError(formRef.current);

    setBusy(true);
    try {
      onSaved(await updateMe(profileBody(form)));
    } catch (error) {
      if (error.status === 401) return onAuthError();
      setErrors(fieldsFromServer(error.fields));
      setFormError(error.message);
      focusFirstError(formRef.current);
    }
    setBusy(false);
  }

  return (
    <section className="form-panel dashboard-panel">
      <h2>بياناتي وأسعاري</h2>
      <dl className="summary-list compact profile-fixed">
        <div>
          <dt>رقم الجوال</dt>
          <dd dir="ltr">{me.phone}</dd>
        </div>
        <div>
          <dt>المدينة</dt>
          <dd>{cityName}</dd>
        </div>
      </dl>
      <form ref={formRef} onSubmit={submit} noValidate>
        <SupplierFields form={form} errors={errors} update={update} />
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> جارٍ الحفظ…
            </>
          ) : (
            <>
              حفظ التغييرات <Check size={18} />
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
