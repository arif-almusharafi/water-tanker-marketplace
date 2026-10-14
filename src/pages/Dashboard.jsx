import { useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Check,
  CheckCheck,
  ClipboardList,
  LayoutDashboard,
  ListOrdered,
  Star,
  Truck,
  X,
} from "lucide-react";
import { Button, MapPreview } from "../components/UI";
import { incomingOrders } from "../data/mock";
export default function Dashboard({ notify }) {
  const [available, setAvailable] = useState(true);
  const [orders, setOrders] = useState(incomingOrders);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([
    {
      id: 3098,
      name: "عبدالرحمن الشهري",
      area: "العقيق",
      price: 210,
      result: "مكتمل",
    },
    {
      id: 3096,
      name: "ريم الحربي",
      area: "النرجس",
      price: 120,
      result: "مكتمل",
    },
  ]);
  const [tab, setTab] = useState("overview");
  const completed = history.filter((o) => o.result === "مكتمل");
  function handleOrder(order, accept) {
    setOrders((list) => list.filter((o) => o.id !== order.id));
    if (accept) setActive((list) => [...list, order]);
    else setHistory((list) => [{ ...order, result: "مرفوض" }, ...list]);
    notify(
      accept
        ? "تم قبول الطلب وإضافته للتوصيلات النشطة"
        : "تم رفض الطلب التجريبي",
    );
  }
  return (
    <main className="container dashboard-layout">
      <aside className="dashboard-sidebar">
        <span className="supplier-icon blue">
          <Truck size={32} />
        </span>
        <h3>
          مياه النقاء <BadgeCheck size={17} className="verified" />
        </h3>
        <p>شريك موية المعتمد</p>
        <span className="demo-tag">لوحة تجريبية</span>
        <nav>
          {[
            [LayoutDashboard, "overview", "نظرة عامة"],
            [ClipboardList, "incoming", "الطلبات الواردة"],
            [Truck, "active", "التوصيلات النشطة"],
            [ListOrdered, "history", "سجل الطلبات"],
          ].map(([Icon, id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-help">
          <h4>شغلك أسهل مع موية</h4>
          <p>كل طلب جديد، فرصة تكبر.</p>
          <small>جميع الأرقام والطلبات توضيحية.</small>
        </div>
      </aside>
      <div className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">لوحة المورد</span>
            <h1>حيّاك الله، عبدالله 👋</h1>
            <p>هذي نظرة على شغلك اليوم.</p>
          </div>
          <label className="availability-toggle">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => {
                setAvailable(e.target.checked);
                notify(
                  e.target.checked
                    ? "أنت متاح لاستقبال الطلبات"
                    : "تم إيقاف استقبال الطلبات الجديدة",
                );
              }}
            />
            <span className="switch" />
            <span>
              {available ? "متاح لاستقبال الطلبات" : "غير متاح حالياً"}
            </span>
          </label>
        </div>
        <div className="stats-grid">
          {[
            [ClipboardList, orders.length, "طلبات جديدة"],
            [CheckCheck, completed.length, "طلبات مكتملة اليوم"],
            [
              Banknote,
              `${completed.reduce((sum, o) => sum + o.price, 0)} ر.س`,
              "إيرادات اليوم",
            ],
            [Star, "4.9", "متوسط التقييم"],
          ].map(([Icon, value, label]) => (
            <article className="stat-card" key={label}>
              <Icon size={22} />
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
        {(tab === "overview" || tab === "incoming") && (
          <section className="form-panel dashboard-panel">
            <div className="tracking-heading">
              <h2>
                الطلبات الواردة{" "}
                <span className="count-badge">{orders.length}</span>
              </h2>
              <span className="muted small">الرياض</span>
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
                      {[
                        "العميل / الحي",
                        "الحجم",
                        "المسافة",
                        "السعر",
                        "الموعد",
                        "الإجراء",
                      ].map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.name}</strong>
                          <small>
                            {o.area} · #{o.id}
                          </small>
                        </td>
                        <td>{o.capacity} طن</td>
                        <td>{o.distance} كم</td>
                        <td>{o.price} ر.س</td>
                        <td>{o.time}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="accept-button"
                              disabled={!available}
                              onClick={() => handleOrder(o, true)}
                            >
                              <Check size={14} /> قبول
                            </button>
                            <button
                              className="reject-button"
                              onClick={() => handleOrder(o, false)}
                              aria-label={`رفض طلب ${o.name}`}
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
                <p>تابعت جميع الطلبات. طلبات جديدة بانتظارك قريباً!</p>
              </div>
            )}
          </section>
        )}
        {(tab === "overview" || tab === "active") && (
          <section className="form-panel dashboard-panel">
            <h2>التوصيلات النشطة</h2>
            {active.length ? (
              active.map((o) => (
                <div className="active-delivery" key={o.id}>
                  <span className="soft-icon">
                    <Truck />
                  </span>
                  <div>
                    <strong>
                      {o.name} · {o.area}
                    </strong>
                    <p>
                      {o.capacity} طن · {o.price} ر.س · #{o.id}
                    </p>
                  </div>
                  <Button
                    secondary
                    onClick={() => {
                      setActive((list) => list.filter((a) => a.id !== o.id));
                      setHistory((list) => [
                        { ...o, result: "مكتمل" },
                        ...list,
                      ]);
                      notify("تم إكمال التوصيل وتحديث إيرادات اليوم");
                    }}
                  >
                    تأكيد التسليم
                  </Button>
                </div>
              ))
            ) : (
              <div className="inline-empty">
                <Truck size={29} />
                <p>لا توجد توصيلات نشطة. اقبل طلباً للبدء.</p>
              </div>
            )}
            {active.length > 0 && <MapPreview progress={2} />}
          </section>
        )}
        {(tab === "overview" || tab === "history") && (
          <div className="dashboard-bottom">
            <section className="form-panel dashboard-panel">
              <div className="tracking-heading">
                <h2>إيرادات الأسبوع</h2>
                <span className="muted small">ر.س · بيانات تجريبية</span>
              </div>
              <div className="chart">
                {[650, 920, 780, 1150, 860, 1320, 990].map((v, i) => (
                  <div className="chart-column" key={i}>
                    <span>{v}</span>
                    <div style={{ height: `${v / 10}px` }} />
                    <small>
                      {
                        [
                          "السبت",
                          "الأحد",
                          "الإثنين",
                          "الثلاثاء",
                          "الأربعاء",
                          "الخميس",
                          "الجمعة",
                        ][i]
                      }
                    </small>
                  </div>
                ))}
              </div>
            </section>
            <section className="form-panel dashboard-panel">
              <h2>سجل الطلبات</h2>
              <div className="history-list">
                {history.map((o) => (
                  <div key={o.id}>
                    <span>
                      <strong>{o.name}</strong>
                      <small>
                        {o.area} · #{o.id}
                      </small>
                    </span>
                    <span>
                      <b>{o.price} ر.س</b>
                      <small
                        className={o.result === "مكتمل" ? "green" : "muted"}
                      >
                        {o.result}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
