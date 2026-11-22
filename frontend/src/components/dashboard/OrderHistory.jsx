import { ListOrdered } from "lucide-react";
import { HISTORY_RESULT } from "../../lib/labels";

// "سجل الطلبات": the newest 50 delivered, rejected, and cancelled orders.
export default function OrderHistory({ orders }) {
  return (
    <section className="form-panel dashboard-panel">
      <h2>سجل الطلبات</h2>
      {orders.length ? (
        <div className="history-list">
          {orders.map((o) => (
            <div key={o.reference}>
              <span>
                <strong>{o.customer_name}</strong>
                <small>
                  {o.district_name} · <span dir="ltr">{o.reference}</span>
                </small>
              </span>
              <span>
                <b>{o.price_sar} ر.س</b>
                <small className={o.status === "delivered" ? "green" : "muted"}>
                  {HISTORY_RESULT[o.status]}
                </small>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="inline-empty">
          <ListOrdered size={28} />
          <p>ما فيه طلبات سابقة بعد.</p>
        </div>
      )}
    </section>
  );
}
