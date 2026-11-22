import { useRef, useState } from "react";
import { ArrowLeft, LogIn } from "lucide-react";
import { Button } from "../components/UI";
import Field from "../components/Field";
import PasswordField from "../components/PasswordField";
import { loginSupplier, saveToken } from "../api";
import { cleanPhone, isValidPhone } from "../lib/format";
import { MESSAGES } from "../lib/validation";
import { focusFirstError } from "../lib/focus";

// New page: #/supplier/login. The dashboard also shows it when there is no
// valid token. `onLoggedIn(supplier)` runs after a successful login.
export default function SupplierLogin({ navigate, onLoggedIn }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    const found = {};
    if (!isValidPhone(phone)) found.phone = MESSAGES.phone;
    if (!password) found.password = "اكتب كلمة المرور";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return focusFirstError(formRef.current);

    setBusy(true);
    try {
      const result = await loginSupplier(phone, password);
      saveToken(result.token);
      onLoggedIn(result.supplier);
    } catch (error) {
      // invalid_credentials: "رقم الجوال أو كلمة المرور غير صحيحة"
      setErrors(error.fields || {});
      setFormError(error.message);
      setBusy(false);
    }
  }

  return (
    <main className="container page-shell auth-page">
      <div className="page-intro">
        <span className="eyebrow">لوحة المورد</span>
        <h1>تسجيل دخول المورد</h1>
        <p>ادخل برقم جوالك وكلمة المرور لإدارة طلباتك وأسعارك.</p>
      </div>
      <form ref={formRef} onSubmit={submit} noValidate>
        <div className="form-panel">
          <div className="panel-title">
            <span className="soft-icon">
              <LogIn />
            </span>
            <div>
              <h2>حيّاك في موية</h2>
              <p>العملاء ما يحتاجون حساب. هذي الصفحة للموردين فقط.</p>
            </div>
          </div>
          <Field
            label="رقم الجوال"
            name="phone"
            type="tel"
            dir="ltr"
            inputMode="numeric"
            autoComplete="username"
            placeholder="05XXXXXXXX"
            value={phone}
            error={errors.phone}
            onChange={(e) => setPhone(cleanPhone(e.target.value))}
          />
          <PasswordField
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" className="full-width" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" /> جارٍ تسجيل الدخول…
              </>
            ) : (
              <>
                تسجيل الدخول <ArrowLeft size={18} />
              </>
            )}
          </Button>
        </div>
      </form>
      <p className="auth-switch">
        ما عندك حساب؟{" "}
        <button className="text-button" onClick={() => navigate("supplier/register")}>
          انضم كمورد <ArrowLeft size={16} />
        </button>
      </p>
    </main>
  );
}
