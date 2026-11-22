import { ArrowLeft, CloudOff, RotateCw, Truck } from "lucide-react";
import { NETWORK_ERROR_MESSAGE } from "../api";
import { Button } from "./UI";

// Shown while data is loading, so the page is never blank.
export function LoadingState({ text = "جارٍ التحميل…" }) {
  return (
    <div className="state-box" role="status">
      <span className="spinner dark" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

// Shown when the API cannot be reached or answers with an error.
export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-box error" role="alert">
      <CloudOff size={28} aria-hidden="true" />
      <p>{error?.message || NETWORK_ERROR_MESSAGE}</p>
      {onRetry && (
        <Button secondary onClick={onRetry}>
          <RotateCw size={17} aria-hidden="true" /> إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

// Shown on Home and Order step 3 when a city has no available supplier.
export function NoSuppliers({ cityName, onJoin }) {
  return (
    <div className="state-box">
      <Truck size={30} aria-hidden="true" />
      <p>لا يوجد موردون متاحون في {cityName} حالياً</p>
      <small className="muted">جرّب مدينة ثانية أو ارجع لنا بعد شوي.</small>
      <button type="button" className="text-button" onClick={onJoin}>
        عندك وايت؟ انضم كمورد <ArrowLeft size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// A short error line under a form field, linked with aria-describedby.
export function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <span className="field-error" id={id}>
      {message}
    </span>
  );
}
