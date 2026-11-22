import { BadgeCheck, Check, Clock3, MapPin, Phone, SearchX, Truck, X } from "lucide-react";
import { useState } from "react";
import { Button, MapPreview, Modal } from "../components/UI";
import { ErrorState, LoadingState } from "../components/States";
import RefLookup from "../components/RefLookup";
import { cancelOrder, getLastOrderRef, getOrder } from "../api";
import { useApi } from "../lib/useApi";
import { useInterval } from "../lib/useInterval";
import { etaRange, formatDateTime } from "../lib/format";
import {
  FINAL_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHODS,
  TIMELINE,
  WATER_TYPES,
} from "../lib/labels";

const REFRESH_MS = 20000; // the contract says: every 20 seconds
const CANCELLABLE = ["pending", "accepted"];

// #/tracking?ref=MW-XXXXXXXX. With no ref, uses the last order of this browser.
export default function Tracking({ refParam, startOrder, notify, navigate }) {
  const reference = refParam || getLastOrderRef();
  if (!reference)
    return (
      <main className="container empty-state">
        <span className="empty-icon">
          <Truck size={44} />
        </span>
        <h1>طلبك القادم يبدأ هنا</h1>
        <p>ما عندك طلب حالي. اطلب وايت وبتلقى جميع تفاصيله هنا.</p>
        <Button onClick={() => startOrder()}>اطلب وايت الآن</Button>
        <RefLookup navigate={navigate} />
      </main>
    );
  return (
    <OrderTracking
      key={reference}
      reference={reference}
      startOrder={startOrder}
      notify={notify}
      navigate={navigate}
    />
  );
}

function OrderTracking({ reference, startOrder, notify, navigate }) {
  const result = useApi(() => getOrder(reference), [reference]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");
  const order = result.data;

  // Check the API again while the order can still change.
  useInterval(
    () => getOrder(reference).then(result.setData).catch(() => {}),
    REFRESH_MS,
    Boolean(order) && !FINAL_STATUSES.includes(order.status),
  );

  async function confirmCancel() {
    setCancelling(true);
    setActionError("");
    try {
      result.setData(await cancelOrder(reference));
      notify("تم إلغاء الطلب");
    } catch (error) {
      // cannot_cancel: the tanker already left. Show the error and the new status.
      setActionError(error.message);
      getOrder(reference).then(result.setData).catch(() => {});
    }
    setCancelling(false);
    setCancelOpen(false);
  }

  if (result.error?.code === "order_not_found")
    return (
      <main className="container empty-state">
        <span className="empty-icon">
          <SearchX size={44} />
        </span>
        <h1>ما لقينا طلب بهذا الرقم</h1>
        <p>
          تأكد من رقم الطلب <b dir="ltr">{reference}</b> وجرب مرة ثانية.
        </p>
        <RefLookup navigate={navigate} />
        <Button secondary onClick={() => startOrder()}>
          اطلب وايت الآن
        </Button>
      </main>
    );
  if (result.error)
    return (
      <main className="container page-shell">
        <ErrorState error={result.error} onRetry={result.reload} />
      </main>
    );
  if (!order)
    return (
      <main className="container page-shell">
        <LoadingState text="جارٍ تحميل طلبك…" />
      </main>
    );

  const step = TIMELINE.indexOf(order.status); // -1 when rejected or cancelled
  const isFinal = FINAL_STATUSES.includes(order.status);
  const supplier = order.supplier;

  return (
    <main className="container page-shell">
      <div className="page-intro">
        <span className="eyebrow">معك في كل خطوة</span>
        <h1>{headline(order.status)}</h1>
        <p>
          رقم الطلب <b dir="ltr">{order.reference}</b>
        </p>
      </div>
      <div className="tracking-grid">
        <section className="form-panel">
          <div className="tracking-heading">
            <h2>رحلة طلبك</h2>
            <span className={`available status-${order.status}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <MapPreview progress={Math.max(step, 0)} area={order.district_name} />
          <ol className="timeline">
            {TIMELINE.map((status, i) => (
              <li key={status} className={i <= step ? "active" : ""}>
                <span>{i <= step ? <Check size={15} /> : i + 1}</span>
                <div>
                  <strong>{ORDER_STATUS_LABELS[status]}</strong>
                  {i === step && <small>الحالة الحالية</small>}
                </div>
              </li>
            ))}
          </ol>
          {!isFinal && (
            <p className="muted small refresh-note">
              تتحدث حالة الطلب تلقائياً كل 20 ثانية.
            </p>
          )}
          {isFinal && <Button onClick={() => startOrder()}>اطلب مرة ثانية</Button>}
        </section>
        <aside className="tracking-details">
          <section className="form-panel">
            <div className="driver-profile">
              <span className="supplier-icon blue">
                <Truck />
              </span>
              <div>
                <h3>
                  {supplier.name}{" "}
                  <BadgeCheck size={17} className="verified" aria-label="مورد موثّق" />
                </h3>
                <p>السائق: {supplier.driver_name || "يحدده المورد"}</p>
              </div>
            </div>
            <div className="eta-box">
              <Clock3 size={23} />
              <div>
                <small>
                  {order.delivery_time === "scheduled"
                    ? "موعد التوصيل المحدد"
                    : "وقت الوصول المتوقع"}
                </small>
                <strong>{etaText(order)}</strong>
              </div>
            </div>
            {supplier.phone ? (
              <a className="button secondary full-width" href={`tel:${supplier.phone}`}>
                <Phone size={17} /> اتصال بالسائق
              </a>
            ) : (
              <>
                <Button
                  secondary
                  className="full-width"
                  disabled
                  aria-describedby="call-hint"
                >
                  <Phone size={17} /> اتصال بالسائق
                </Button>
                <p className="muted small call-hint" id="call-hint">
                  يظهر رقم المورد بعد ما يقبل طلبك.
                </p>
              </>
            )}
          </section>
          <section className="form-panel">
            <h3>تفاصيل التوصيل</h3>
            <p className="address-line">
              <MapPin size={18} />
              {order.city_name}، {order.district_name}
            </p>
            <p className="muted">{order.address}</p>
            <dl className="summary-list compact">
              <div>
                <dt>الوايت</dt>
                <dd>
                  {order.capacity_tons} طن · {WATER_TYPES[order.water_type]}
                </dd>
              </div>
              {order.notes && (
                <div>
                  <dt>ملاحظات</dt>
                  <dd>{order.notes}</dd>
                </div>
              )}
              <div>
                <dt>طريقة الدفع</dt>
                <dd>{PAYMENT_METHODS[order.payment_method]}</dd>
              </div>
              <div>
                <dt>الإجمالي</dt>
                <dd>
                  <b>{order.price_sar} ر.س</b>
                </dd>
              </div>
            </dl>
            {actionError && (
              <p className="form-error" role="alert">
                {actionError}
              </p>
            )}
            {CANCELLABLE.includes(order.status) && (
              <button className="danger-button" onClick={() => setCancelOpen(true)}>
                <X size={17} /> إلغاء الطلب
              </button>
            )}
          </section>
        </aside>
      </div>
      {cancelOpen && (
        <Modal title="إلغاء الطلب؟" onClose={() => setCancelOpen(false)}>
          <p>تقدر تلغي الطلب قبل ما يطلع الوايت. وتقدر تطلب مرة ثانية بأي وقت.</p>
          <div className="modal-actions">
            <Button onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? "جارٍ الإلغاء…" : "نعم، إلغاء الطلب"}
            </Button>
            <Button secondary onClick={() => setCancelOpen(false)}>
              الاحتفاظ بالطلب
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function headline(status) {
  if (status === "cancelled") return "تم إلغاء الطلب";
  if (status === "rejected") return "اعتذر المورد عن طلبك";
  if (status === "delivered") return "وصلت الموية، بالعافية!";
  return "طلبك في أيدٍ أمينة";
}

// No fake countdown: the supplier's typical time, or the scheduled time.
function etaText(order) {
  if (order.status === "cancelled") return "تم إلغاء التوصيل";
  if (order.status === "rejected") return "لم يتم قبول الطلب";
  if (order.status === "delivered") return "تم التسليم بنجاح";
  if (order.status === "arrived") return "الوايت عند موقعك";
  if (order.delivery_time === "scheduled") return formatDateTime(order.scheduled_at);
  return etaRange(order.supplier.eta_minutes);
}
