import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FieldError } from "./States";

// Password input with a show / hide button. Paste and password managers work.
export default function PasswordField({
  label = "كلمة المرور",
  value,
  onChange,
  error,
  autoComplete,
  hint,
}) {
  const [visible, setVisible] = useState(false);
  const describedBy = [error && "password-error", hint && "password-hint"]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label>
        {label}
        <span className="password-wrap">
        <input
          name="password"
          type={visible ? "text" : "password"}
          dir="ltr"
          autoComplete={autoComplete}
          maxLength={72}
          value={value}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        </span>
      </label>
      {hint && (
        <span className="field-hint" id="password-hint">
          {hint}
        </span>
      )}
      <FieldError id="password-error" message={error} />
    </div>
  );
}
