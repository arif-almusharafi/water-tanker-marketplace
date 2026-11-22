import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Droplets, Menu, X } from "lucide-react";
import { Button, Logo, Modal } from "./components/UI";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Tracking from "./pages/Tracking";
import Dashboard from "./pages/Dashboard";
import SupplierRegister from "./pages/SupplierRegister";
import SupplierLogin from "./pages/SupplierLogin";
import { getCities, saveLastOrderRef } from "./api";
import { useApi } from "./lib/useApi";
import { hashParam } from "./lib/format";
// "#/supplier/login?x=1" -> "supplier/login"
const currentRoute = () =>
  window.location.hash.replace("#/", "").split("?")[0] || "home";
export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [refParam, setRefParam] = useState(() => hashParam("ref"));
  const cities = useApi(getCities); // loaded once, used by many pages
  const [city, setCity] = useState(""); // city id; empty means the first city
  const cityId = city || cities.data?.[0]?.id || "";
  const [initialSupplier, setInitialSupplier] = useState(null);
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  const [info, setInfo] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const handler = () => {
      setRoute(currentRoute());
      setRefParam(hashParam("ref"));
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
            cities={cities}
            city={cityId}
            setCity={setCity}
            startOrder={startOrder}
          />
        </main>
      ) : route === "order" ? (
        <Order
          key={initialSupplier?.id || "new"}
          cities={cities}
          city={cityId}
          initialSupplier={initialSupplier}
          navigate={navigate}
          onConfirm={(o) => {
            saveLastOrderRef(o.reference);
            setToast("تم تأكيد طلبك بنجاح");
            navigate(`tracking?ref=${o.reference}`);
          }}
        />
      ) : route === "tracking" ? (
        <Tracking
          refParam={refParam}
          startOrder={startOrder}
          notify={setToast}
          navigate={navigate}
        />
      ) : route === "dashboard" ? (
        <Dashboard cities={cities} notify={setToast} navigate={navigate} />
      ) : route === "supplier/register" ? (
        <SupplierRegister cities={cities} navigate={navigate} notify={setToast} />
      ) : route === "supplier/login" ? (
        <SupplierLogin
          navigate={navigate}
          onLoggedIn={() => navigate("dashboard")}
        />
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
            <button onClick={() => navigate("supplier/register")}>
              انضم كمورد
            </button>
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
            <Droplets size={14} /> صُنع لراحتك · نسخة أولى
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
            اطلب وايت كعميل بدون حساب، أو ادخل لوحة المورد برقم جوالك وكلمة
            المرور.
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
            عندك وايت وما عندك حساب؟{" "}
            <button
              className="inline-link"
              onClick={() => {
                setLogin(false);
                navigate("supplier/register");
              }}
            >
              انضم كمورد
            </button>
          </small>
        </Modal>
      )}
      {info && (
        <Modal title={info} onClose={() => setInfo(null)}>
          {info === "الأسئلة الشائعة" ? (
            <div className="faq">
              <h3>كيف أطلب وايت؟</h3>
              <p>حدد عنوانك، واختر حجم الوايت والمورد، ثم أكد طلبك.</p>
              <h3>كيف أدفع؟</h3>
              <p>
                الدفع عند الاستلام للسائق: نقداً أو شبكة / مدى. ما فيه دفع
                إلكتروني حالياً.
              </p>
              <h3>هل أقدر أتابع الطلب؟</h3>
              <p>
                نعم، بعد التأكيد يظهر لك رقم الطلب. افتح تتبع الطلب وتتحدث
                الحالة تلقائياً.
              </p>
              <h3>هل أقدر ألغي الطلب؟</h3>
              <p>تقدر تلغي الطلب قبل ما يطلع الوايت للتوصيل.</p>
              <h3>كيف أنضم كمورد؟</h3>
              <p>
                سجّل من صفحة انضم كمورد، ويظهر حسابك للعملاء بعد موافقة فريق
                موية.
              </p>
            </div>
          ) : (
            <>
              <p>
                عند تأكيد الطلب نرسل اسمك ورقم جوالك وعنوانك إلى خادم موية
                ونحفظها لتنفيذ الطلب، ونشاركها مع المورد اللي اخترته فقط.
              </p>
              <p>
                ما نجمع بيانات دفع، وما نستخدم أدوات تتبع أو إعلانات. رقم الطلب
                هو مفتاح متابعة طلبك، فلا تشاركه مع أحد.
              </p>
              <p>
                للموردين: نحفظ كلمة المرور مشفرة، ورقم جوالك يظهر للعميل بعد
                قبول طلبه فقط. لطلب حذف بياناتك تواصل معنا.
              </p>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
