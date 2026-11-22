import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  ClipboardList,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Truck,
  UserRound,
} from "lucide-react";
import { ErrorState, LoadingState } from "../components/States";
import SupplierLogin from "./SupplierLogin";
import ApprovalBanner from "../components/dashboard/ApprovalBanner";
import StatsCards from "../components/dashboard/StatsCards";
import IncomingOrders from "../components/dashboard/IncomingOrders";
import ActiveDeliveries from "../components/dashboard/ActiveDeliveries";
import RevenueChart from "../components/dashboard/RevenueChart";
import OrderHistory from "../components/dashboard/OrderHistory";
import ProfilePanel from "../components/dashboard/ProfilePanel";
import {
  clearToken,
  getMe,
  getMyOrders,
  getMyStats,
  getToken,
  logoutSupplier,
  setMyOrderStatus,
  updateMe,
} from "../api";
import { useInterval } from "../lib/useInterval";

const REFRESH_MS = 30000; // the contract says: every 30 seconds

const TABS = [
  [LayoutDashboard, "overview", "نظرة عامة"],
  [ClipboardList, "incoming", "الطلبات الواردة"],
  [Truck, "active", "التوصيلات النشطة"],
  [ListOrdered, "history", "سجل الطلبات"],
  [UserRound, "profile", "بياناتي وأسعاري"],
];

const STATUS_MESSAGES = {
  accepted: "تم قبول الطلب وإضافته للتوصيلات النشطة",
  rejected: "تم رفض الطلب",
  on_the_way: "تم تحديث الطلب: الوايت في الطريق",
  arrived: "تم تحديث الطلب: الوايت وصل",
  delivered: "تم إكمال التوصيل وتحديث إيرادات اليوم",
};

// #/dashboard. Shows the login page when there is no valid token.
export default function Dashboard({ cities, notify, navigate }) {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));
  const onLoggedOut = useCallback(() => setLoggedIn(false), []);
  if (!loggedIn)
    return <SupplierLogin navigate={navigate} onLoggedIn={() => setLoggedIn(true)} />;
  return (
    <SupplierBoard
      cities={cities}
      notify={notify}
      navigate={navigate}
      onLoggedOut={onLoggedOut}
    />
  );
}

function SupplierBoard({ cities, notify, navigate, onLoggedOut }) {
  const [me, setMe] = useState(null);
  const [board, setBoard] = useState(null); // { incoming, active, history, stats }
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [busyRef, setBusyRef] = useState(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [tab, setTab] = useState("overview");

  // Loads everything the dashboard shows. A 401 means the token is gone.
  const refresh = useCallback(async () => {
    try {
      const [meData, incoming, active, history, stats] = await Promise.all([
        getMe(),
        getMyOrders("incoming"),
        getMyOrders("active"),
        getMyOrders("history"),
        getMyStats(),
      ]);
      setMe(meData);
      setBoard({ incoming, active, history, stats });
      setLoadError(null);
    } catch (error) {
      if (error.status === 401) return onLoggedOut();
      setLoadError(error);
    }
  }, [onLoggedOut]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useInterval(refresh, REFRESH_MS);

  async function changeStatus(order, status) {
    setBusyRef(order.reference);
    setActionError("");
    try {
      await setMyOrderStatus(order.reference, status);
      notify(STATUS_MESSAGES[status]);
    } catch (error) {
      if (error.status === 401) return onLoggedOut();
      setActionError(error.message); // for example invalid_status_change
    }
    await refresh();
    setBusyRef(null);
  }

  async function changeAvailability(isAvailable) {
    setSavingAvailability(true);
    setActionError("");
    // Move the switch at once; put it back if the server says no.
    setMe((m) => ({ ...m, is_available: isAvailable }));
    try {
      setMe(await updateMe({ is_available: isAvailable }));
      notify(
        isAvailable ? "أنت متاح لاستقبال الطلبات" : "تم إيقاف استقبال الطلبات الجديدة",
      );
    } catch (error) {
      if (error.status === 401) return onLoggedOut();
      setMe((m) => ({ ...m, is_available: !isAvailable }));
      setActionError(error.message);
    }
    setSavingAvailability(false);
  }

  async function logout() {
    // Remove the token even if the server cannot be reached.
    await logoutSupplier().catch(() => {});
    clearToken();
    notify("تم تسجيل الخروج");
    navigate("");
  }

  if (!me && loadError)
    return (
      <main className="container page-shell">
        <ErrorState error={loadError} onRetry={refresh} />
      </main>
    );
  if (!me)
    return (
      <main className="container page-shell">
        <LoadingState text="جارٍ تحميل لوحة المورد…" />
      </main>
    );

  const approved = me.approval_status === "approved";
  const cityName = cities.data?.find((c) => c.id === me.city_id)?.name || "";
  const show = (name) => tab === "overview" || tab === name;

  return (
    <main className="container dashboard-layout">
      <aside className="dashboard-sidebar">
        <span className="supplier-icon blue">
          <Truck size={32} />
        </span>
        <h3>
          {me.name}{" "}
          {approved && (
            <BadgeCheck size={17} className="verified" aria-label="مورد موثّق" />
          )}
        </h3>
        <p>{approved ? "شريك موية المعتمد" : "بانتظار موافقة فريق موية"}</p>
        <nav aria-label="أقسام لوحة المورد">
          {TABS.map(([Icon, id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
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
        </div>
      </aside>
      <div className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">لوحة المورد</span>
            <h1>حيّاك الله، {me.name}</h1>
            <p>هذي نظرة على شغلك اليوم.</p>
          </div>
          <div className="heading-actions">
            <label className="availability-toggle">
              <input
                type="checkbox"
                checked={me.is_available}
                disabled={savingAvailability}
                onChange={(e) => changeAvailability(e.target.checked)}
              />
              <span className="switch" />
              <span>{me.is_available ? "متاح لاستقبال الطلبات" : "غير متاح حالياً"}</span>
            </label>
            <button type="button" className="logout-button" onClick={logout}>
              <LogOut size={16} aria-hidden="true" /> تسجيل الخروج
            </button>
          </div>
        </div>
        <ApprovalBanner
          status={me.approval_status}
          onEditProfile={() => setTab("profile")}
        />
        {loadError && (
          <ErrorState error={loadError} onRetry={refresh} />
        )}
        {actionError && (
          <p className="form-error" role="alert">
            {actionError}
          </p>
        )}
        {tab === "profile" ? (
          <ProfilePanel
            me={me}
            cityName={cityName}
            onAuthError={onLoggedOut}
            onSaved={(saved) => {
              setMe(saved);
              notify("تم حفظ بياناتك وأسعارك");
            }}
          />
        ) : !board ? (
          <LoadingState />
        ) : (
          <>
            <StatsCards stats={board.stats} />
            {show("incoming") && (
              <IncomingOrders
                orders={board.incoming}
                cityName={cityName}
                available={me.is_available}
                busyRef={busyRef}
                onAccept={(o) => changeStatus(o, "accepted")}
                onReject={(o) => changeStatus(o, "rejected")}
              />
            )}
            {show("active") && (
              <ActiveDeliveries
                orders={board.active}
                busyRef={busyRef}
                onStatus={changeStatus}
              />
            )}
            {show("history") && (
              <div className="dashboard-bottom">
                <RevenueChart days={board.stats.revenue_last_7_days} />
                <OrderHistory orders={board.history} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
