import {
  BadgeCheck,
  Check,
  Clock3,
  MapPin,
  Phone,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button, MapPreview, Modal } from "../components/UI";
import { formatSchedule, statuses } from "../data/mock";
export default function Tracking({ order, setOrder, startOrder, notify }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  if (!order)
    return (
      <main className="container empty-state">
        <span className="empty-icon">
          <Truck size={44} />
        </span>
        <h1>طلبك القادم يبدأ هنا</h1>
        <p>ما عندك طلب حالي. اطلب وايت وبتلقى جميع تفاصيله هنا.</p>
        <Button onClick={() => startOrder()}>اطلب وايت الآن</Button>
      </main>
    );
  return (
    <main className="container page-shell">
      <div className="page-intro">
        <span className="eyebrow">معك في كل خطوة</span>
        <h1>
          {order.cancelled
            ? "تم إلغاء الطلب"
            : order.status === 4
              ? "وصلت الموية، بالعافية!"
              : "طلبك في أيدٍ أمينة"}
        </h1>
        <p>
          رقم الطلب <b dir="ltr">{order.id}</b>{" "}
          <span className="demo-tag">طلب تجريبي</span>
        </p>
      </div>
      <div className="tracking-grid">
        <section className="form-panel">
          <div className="tracking-heading">
            <h2>رحلة طلبك</h2>
            <span className="available">
              {order.cancelled ? "ملغي" : statuses[order.status]}
            </span>
          </div>
          <MapPreview progress={order.status} area={order.area} />
          <ol className="timeline">
            {statuses.map((s, i) => (
              <li
                key={s}
                className={
                  !order.cancelled && i <= order.status ? "active" : ""
                }
              >
                <span>
                  {i <= order.status && !order.cancelled ? (
                    <Check size={15} />
                  ) : (
                    i + 1
                  )}
                </span>
                <div>
                  <strong>{s}</strong>
                  {i === order.status && !order.cancelled && (
                    <small>الحالة الحالية</small>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {!order.cancelled && order.status < 4 && (
            <Button
              className="full-width"
              onClick={() => {
                setOrder({ ...order, status: order.status + 1 });
                notify(
                  order.status === 3
                    ? "تم تسليم طلبك التجريبي بنجاح"
                    : "تم تحديث حالة الطلب",
                );
              }}
            >
              محاكاة: الانتقال للحالة التالية <Truck size={17} />
            </Button>
          )}
          {(order.cancelled || order.status === 4) && (
            <Button onClick={() => startOrder()}>اطلب مرة ثانية</Button>
          )}
        </section>
        <aside className="tracking-details">
          <section className="form-panel">
            <div className="driver-profile">
              <span className="supplier-icon blue">
                <Truck />
              </span>
              <div>
                <h3>
                  {order.supplier.name}{" "}
                  <BadgeCheck size={17} className="verified" />
                </h3>
                <p>السائق: {order.supplier.driver}</p>
              </div>
            </div>
            <div className="eta-box">
              <Clock3 size={23} />
              <div>
                <small>
                  {order.time === "later"
                    ? "موعد التوصيل المحدد"
                    : "وقت الوصول المتوقع"}
                </small>
                <strong>
                  {order.cancelled
                    ? "تم إلغاء التوصيل"
                    : order.status === 4
                      ? "تم التسليم بنجاح"
                      : order.time === "later"
                        ? formatSchedule(order.schedule)
                        : order.status === 3
                          ? "الوايت عند موقعك"
                          : `${Math.max(5, order.supplier.eta - order.status * 8)}–${Math.max(10, order.supplier.eta + 10 - order.status * 8)} دقيقة`}
                </strong>
              </div>
            </div>
            <Button
              secondary
              className="full-width"
              onClick={() =>
                notify(
                  "اتصال تجريبي: السائق متاح عبر التطبيق في النسخة الفعلية.",
                )
              }
            >
              <Phone size={17} /> اتصال بالسائق
            </Button>
          </section>
          <section className="form-panel">
            <h3>تفاصيل التوصيل</h3>
            <p className="address-line">
              <MapPin size={18} />
              {order.city}، {order.area}
            </p>
            <p className="muted">{order.address}</p>
            <dl className="summary-list compact">
              <div>
                <dt>الوايت</dt>
                <dd>
                  {order.capacity} طن · مياه {order.water}
                </dd>
              </div>
              <div>
                <dt>رقم اللوحة التجريبي</dt>
                <dd>أ ب ج ٤٢١٧</dd>
              </div>
              <div>
                <dt>طريقة الدفع</dt>
                <dd>{order.payment}</dd>
              </div>
              <div>
                <dt>الإجمالي</dt>
                <dd>
                  <b>{order.price} ر.س</b>
                </dd>
              </div>
            </dl>
            {!order.cancelled && order.status < 4 && (
              <button
                className="danger-button"
                onClick={() => setCancelOpen(true)}
              >
                <X size={17} /> إلغاء الطلب التجريبي
              </button>
            )}
          </section>
        </aside>
      </div>
      {cancelOpen && (
        <Modal title="إلغاء الطلب؟" onClose={() => setCancelOpen(false)}>
          <p>
            سيتم إيقاف رحلة هذا الطلب التجريبي. تقدر تطلب مرة ثانية بأي وقت.
          </p>
          <div className="modal-actions">
            <Button
              onClick={() => {
                setOrder({ ...order, cancelled: true });
                setCancelOpen(false);
                notify("تم إلغاء الطلب التجريبي");
              }}
            >
              نعم، إلغاء الطلب
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
