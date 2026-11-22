import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Droplets,
  MapPin,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { etaRange, supplierColor } from "../lib/format";
export function Logo({ light = false }) {
  return (
    <a
      className={`logo ${light ? "light" : ""}`}
      href="#/"
      aria-label="موية، الرئيسية"
    >
      <span className="logo-icon">
        <Droplets size={30} />
      </span>
      <span>
        موية<span className="logo-caption">الماء أقرب لك</span>
      </span>
    </a>
  );
}
export function Button({ children, secondary, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`button ${secondary ? "secondary" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
// `s` is a SupplierPublic from the API. Every listed supplier is approved,
// so the verified badge shows on all cards. There is no GPS, so no distance.
export function SupplierCard({
  supplier: s,
  onSelect,
  selected,
  price = s.prices_sar["6"],
}) {
  return (
    <article className={`supplier-card ${selected ? "selected" : ""}`}>
      <div className="supplier-top">
        <div className={`supplier-icon ${supplierColor(s.id)}`}>
          <Droplets size={29} />
        </div>
        <span className="available">
          <i /> متاح الآن
        </span>
      </div>
      <h3>
        {s.name}{" "}
        <BadgeCheck size={18} className="verified" aria-label="مورد موثّق" />
      </h3>
      {s.tagline && <p className="supplier-subtitle">{s.tagline}</p>}
      <div className="rating">
        <Star size={15} />
        <strong>مورد جديد</strong>
        <span>
          ({s.delivered_orders_count.toLocaleString("en")} طلب مكتمل)
        </span>
      </div>
      <div className="supplier-meta">
        <span>
          <Clock3 size={15} /> {etaRange(s.eta_minutes)}
        </span>
      </div>
      <div className="supplier-bottom">
        <div>
          <strong>{price}</strong> <span>ر.س</span>
          <small>للوايت · شامل الضريبة</small>
        </div>
        <button
          type="button"
          className={`small-button ${selected ? "chosen" : ""}`}
          onClick={() => onSelect(s)}
        >
          {selected ? "تم الاختيار" : "اختر المورد"}
          {!selected && <ArrowLeft size={15} />}
        </button>
      </div>
    </article>
  );
}
export function Modal({ title, children, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("button")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  function handleKeyDown(event) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab") return;
    const elements = dialogRef.current.querySelectorAll(
      'button, a[href], input, select, textarea, [tabindex="0"]',
    );
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button close-modal"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X />
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
// A decorative picture only (no real map or GPS in v1).
export function MapPreview({ progress = 0, area }) {
  return (
    <div
      className="map-preview"
      aria-label="خريطة توضيحية لمسار التوصيل، ليست خريطة حقيقية"
    >
      <div className="map-block b1" />
      <div className="map-block b2" />
      <div className="map-block b3" />
      <div className="map-block b4" />
      <svg viewBox="0 0 600 230" preserveAspectRatio="none">
        <path
          d="M60 180 H210 Q240 180 240 150 V100 Q240 70 270 70 H510"
          fill="none"
          stroke="#0785d8"
          strokeWidth="4"
          strokeDasharray="8 8"
        />
      </svg>
      {area && <span className="map-area">حي {area}</span>}
      <span className="map-home">
        <MapPin fill="#0878d1" color="white" size={35} />
        <b>موقع التوصيل</b>
      </span>
      <span
        className="map-truck"
        style={{
          left: `${10 + progress * 17}%`,
          bottom: `${18 + progress * 10}%`,
        }}
      >
        <Truck size={27} />
      </span>
      <span className="map-label">خريطة توضيحية</span>
    </div>
  );
}
