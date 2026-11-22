import { Phone, Truck } from "lucide-react";
import { Button, MapPreview } from "../UI";
import { formatDateTime } from "../../lib/format";
import { ORDER_STATUS_LABELS, WATER_TYPES } from "../../lib/labels";

// The next step button for an active order (F15).
// "accepted" -> "في الطريق", "on_the_way" -> "وصلت", "arrived" -> none.
const NEXT_STEP = {
  accepted: { status: "on_the_way", label: "في الطريق" },
  on_the_way: { status: "arrived", label: "وصلت" },
};

// "التوصيلات النشطة": accepted, on the way, and arrived orders.
export default function ActiveDeliveries({ orders, busyRef, onStatus }) {
  return (
    <section className="form-panel dashboard-panel">
      <h2>التوصيلات النشطة</h2>
      {orders.length ? (
        orders.map((o) => {
          const next = NEXT_STEP[o.status];
          const busy = busyRef === o.reference;
          return (
            <div className="active-delivery" key={o.reference}>
              <span className="soft-icon">
                <Truck />
              </span>
              <div className="active-info">
                <strong>
                  {o.customer_name} · {o.district_name}
                </strong>
                <p>
                  {o.capacity_tons} طن · {WATER_TYPES[o.water_type]} ·{" "}
                  {o.price_sar} ر.س · <span dir="ltr">{o.reference}</span>
                </p>
                <p>{o.address}</p>
                {o.notes && <p>ملاحظات: {o.notes}</p>}
                <p>
                  <span className="status-chip">{ORDER_STATUS_LABELS[o.status]}</span>
                  {o.delivery_time === "scheduled" &&
                    ` · الموعد: ${formatDateTime(o.scheduled_at)}`}
                </p>
                <a className="phone-link" href={`tel:${o.customer_phone}`}>
                  <Phone size={15} aria-hidden="true" />
                  <span dir="ltr">{o.customer_phone}</span>
                </a>
              </div>
              <div className="active-actions">
                {next && (
                  <Button
                    secondary
                    disabled={busy}
                    onClick={() => onStatus(o, next.status)}
                  >
                    {next.label}
                  </Button>
                )}
                <Button disabled={busy} onClick={() => onStatus(o, "delivered")}>
                  تأكيد التسليم
                </Button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="inline-empty">
          <Truck size={29} />
          <p>لا توجد توصيلات نشطة. اقبل طلباً للبدء.</p>
        </div>
      )}
      {orders.length > 0 && <MapPreview progress={2} />}
    </section>
  );
}
