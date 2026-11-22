import { FieldError } from "./States";

// One form field: a visible label, the control, a hint, and its error message.
// `as` is "input", "select", or "textarea". Other props go to the control.
// Number and phone fields pass dir="ltr" and inputMode="numeric".
// The hint and the error sit outside the <label>, so they are not part of the
// field's name; they are linked with aria-describedby instead.
export default function Field({
  label,
  name,
  error,
  optional = false,
  hint,
  as: Control = "input",
  children,
  ...controlProps
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean);
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label>
        {label}
        {optional && <span className="muted"> (اختياري)</span>}
        <Control
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy.join(" ") || undefined}
          {...controlProps}
        >
          {children}
        </Control>
      </label>
      {hint && (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
