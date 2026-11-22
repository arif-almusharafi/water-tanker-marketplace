import { Check, CheckCheck, X } from "lucide-react";
import { formatDateTime } from "../../lib/format";
import { WATER_TYPES } from "../../lib/labels";

// "الطلبات الواردة": pending orders the supplier can accept or reject.
// `busyRef` is the reference of the order being changed right now.
export default function IncomingOrders({ orders, cityName, available, busyRef, onAccept, onReject }) {
  return (
    <section className="form-panel dashboard-panel">
      <div className="tracking-heading">
        <h2>
          الطلبات الواردة <span className="count-badge">{orders.length}</span>
        </h2>
        <span className="muted small">{cityName}</span>
      </div>
      {!available && (
        <p className="demo-notice">
          أنت غير متاح. فعّل استقبال الطلبات لقبول طلب جديد.
        </p>
      )}
      {orders.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {["العميل / الحي", "الحجم", "السعر", "الموعد", "الإجراء"].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.reference}>
                  <td>
                    <strong>{o.customer_name}</strong>
                    <small>
                      {o.district_name} · <span dir="ltr">{o.reference}</span>
                    </small>
                  </td>
                  <td>
                    {o.capacity_tons} طن
                    <small>{WATER_TYPES[o.water_type]}</small>
                  </td>
                  <td>{o.price_sar} ر.س</td>
                  <td>
                    {o.delivery_time === "asap"
                      ? "في أقرب وقت"
                      : formatDateTime(o.scheduled_at)}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="accept-button"
                        disabled={!available || busyRef === o.reference}
                        onClick={() => onAccept(o)}
                      >
                        <Check size={14} /> قبول
                      </button>
                      <button
                        className="reject-button"
                        disabled={busyRef === o.reference}
                        onClick={() => onReject(o)}
                        aria-label={`رفض طلب ${o.customer_name}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="inline-empty">
          <CheckCheck size={28} />
          <p>ما عندك طلبات جديدة حالياً. بنعرضها هنا أول ما توصل.</p>
        </div>
      )}
    </section>
  );
}
