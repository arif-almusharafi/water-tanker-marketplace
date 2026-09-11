import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Droplets, Menu, X } from "lucide-react";
import { Button, Logo, Modal } from "./components/UI";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Tracking from "./pages/Tracking";
import Dashboard from "./pages/Dashboard";
const currentRoute = () =>
  window.location.hash.replace("#/", "").split("?")[0] || "home";
export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [city, setCity] = useState("الرياض");
  const [initialSupplier, setInitialSupplier] = useState(null);
  const [order, setOrder] = useState(null);
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  const [info, setInfo] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const handler = () => {
      setRoute(currentRoute());
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") {
        setLogin(false);
        setInfo(null);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function navigate(path) {
    if (path === route || (path === "" && route === "home"))
      window.scrollTo({ top: 0, behavior: "smooth" });
    window.location.hash = `/${path}`;
    setMenu(false);
  }
  function section(id) {
    navigate("");
    setTimeout(
      () =>
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      80,
    );
  }
  function startOrder(supplier = null) {
    setInitialSupplier(supplier?.id ? supplier : null);
    navigate("order");
  }
  return (
    <>
      <header className="site-header">
        <div className="container navbar">
          <Logo />
          <nav aria-label="التنقل الرئيسي" className={menu ? "open" : ""}>
            <button
              className={route === "home" ? "active" : ""}
              onClick={() => navigate("")}
            >
              الرئيسية
            </button>
            <button onClick={() => section("how-it-works")}>كيف تعمل</button>
            <button onClick={() => section("suppliers")}>الموردون</button>
            <button
              className={route === "tracking" ? "active" : ""}
              onClick={() => navigate("tracking")}
            >
              تتبع الطلب
            </button>
          </nav>
          <div className="nav-actions">
            <button className="login-button" onClick={() => setLogin(true)}>
              تسجيل الدخول
            </button>
            <Button onClick={() => startOrder()}>
              اطلب وايت الآن <ArrowLeft size={17} />
            </Button>
          </div>
          <button
            className="icon-button menu-button"
            aria-label={menu ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {route === "home" ? (
        <main>
          <Home
            navigate={navigate}
            city={city}
            setCity={setCity}
            startOrder={startOrder}
          />
        </main>
      ) : route === "order" ? (
        <Order
          key={initialSupplier?.id || "new"}
          city={city}
          initialSupplier={initialSupplier}
          onConfirm={(o) => {
            setOrder(o);
            setToast("تم تأكيد طلبك التجريبي بنجاح");
            navigate("tracking");
          }}
        />
      ) : route === "tracking" ? (
        <Tracking
          order={order}
          setOrder={setOrder}
          startOrder={startOrder}
          notify={setToast}
        />
      ) : route === "dashboard" ? (
        <Dashboard notify={setToast} />
      ) : (
        <main className="empty-state">
          <h1>الصفحة غير موجودة</h1>
          <Button onClick={() => navigate("")}>العودة للرئيسية</Button>
        </main>
      )}
      <footer className="footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <Logo />
            <p>
              موية، راحة توصلك.
              <br />
              نربطك بموردين موثوقين لتعبئة خزان منزلك بسهولة.
            </p>
          </div>
          <div>
            <h4>اكتشف موية</h4>
            <button onClick={() => section("how-it-works")}>كيف تعمل</button>
            <button onClick={() => section("suppliers")}>الموردون</button>
            <button onClick={() => navigate("tracking")}>تتبع طلبك</button>
          </div>
          <div>
            <h4>شركاء النجاح</h4>
            <button onClick={() => navigate("dashboard")}>انضم كمورد</button>
            <button onClick={() => navigate("dashboard")}>لوحة المورد</button>
            <button onClick={() => setInfo("الأسئلة الشائعة")}>
              الأسئلة الشائعة
            </button>
          </div>
          <div>
            <h4>تواصل معنا</h4>
            <a href="mailto:hello@mooyah.example" dir="ltr">
              hello@mooyah.example
            </a>
            <span>المملكة العربية السعودية</span>
            <small>بيانات اتصال توضيحية</small>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} موية. جميع الحقوق محفوظة.</span>
          <span className="footer-demo">
            <Droplets size={14} /> صُنع لراحتك · نسخة تجريبية
          </span>
          <button onClick={() => setInfo("الخصوصية والشروط")}>
            الخصوصية والشروط
          </button>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={21} />
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="إغلاق الإشعار">
            <X size={16} />
          </button>
        </div>
      )}
      {login && (
        <Modal title="حيّاك في موية" onClose={() => setLogin(false)}>
          <p>
            جرّب موية كعميل أو استكشف لوحة المورد. ما تحتاج حساب في النسخة
            التجريبية.
          </p>
          <div className="login-options">
            <Button
              onClick={() => {
                setLogin(false);
                startOrder();
              }}
            >
              الدخول كعميل <ArrowLeft size={18} />
            </Button>
            <Button
              secondary
              onClick={() => {
                setLogin(false);
                navigate("dashboard");
              }}
            >
              الدخول كمورد
            </Button>
          </div>
          <small className="muted">
            لا يتم جمع بيانات دخول أو إنشاء حساب حقيقي.
          </small>
        </Modal>
      )}
      {info && (
        <Modal title={info} onClose={() => setInfo(null)}>
          {info === "الأسئلة الشائعة" ? (
            <div className="faq">
              <h3>كيف أطلب وايت؟</h3>
              <p>حدد عنوانك، واختر حجم الوايت والمورد، ثم أكد طلبك.</p>
              <h3>هل الخدمة متاحة فعلياً؟</h3>
              <p>
                هذه نسخة تجريبية ببيانات محلية. لا يتم تنفيذ توصيل أو دفع حقيقي.
              </p>
              <h3>هل أقدر أتابع الطلب؟</h3>
              <p>
                نعم، افتح تتبع الطلب واستخدم زر المحاكاة لتجربة مراحل التوصيل.
              </p>
            </div>
          ) : (
            <p>
              هذا نموذج واجهة أمامية. تُحفظ اختياراتك في ذاكرة الصفحة خلال
              الجلسة فقط وتُمسح عند تحديثها. لا يتم إرسال عنوانك إلى خادم، ولا
              تُجمع بيانات دفع. جميع الموردين والأسعار والتقييمات المعروضة
              تجريبية.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
