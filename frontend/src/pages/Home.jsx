import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock3,
  Headphones,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { Button, SectionHeading, SupplierCard } from "../components/UI";
import DeliveryScene from "../components/DeliveryScene";
import { ErrorState, LoadingState, NoSuppliers } from "../components/States";
import { getSuppliers } from "../api";
import { useApi } from "../lib/useApi";
// `cities` is the API state { data, error, loading, reload } from App.
// `city` is the chosen city id, for example "riyadh".
export default function Home({ navigate, cities, city, setCity, startOrder }) {
  const cityName = cities.data?.find((c) => c.id === city)?.name || "";
  // Wait for the city before asking for its suppliers.
  const suppliers = useApi(
    () => (city ? getSuppliers(city) : new Promise(() => {})),
    [city],
  );
  const count = suppliers.data?.length;
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">
              <span className="live-dot" /> قطرة راحة… توصل لبابك
            </span>
            <h1>
              موية توصلك
              <br />
              <span>
                بسهولة<span className="headline-dot">.</span>
              </span>
            </h1>
            <p>
              اطلب وايت الماء المناسب لخزان منزلك، وقارن بين
              <br className="desktop-break" /> الموردين والأسعار ووقت الوصول. كل
              هذا في مكان واحد.
            </p>
            <div className="hero-actions">
              <Button onClick={() => startOrder()}>
                اطلب الآن <ArrowLeft size={19} />
              </Button>
              <Button secondary onClick={() => navigate("supplier/register")}>
                انضم كمورد <Truck size={19} />
              </Button>
            </div>
            <div className="hero-proof">
              <ShieldCheck size={26} className="hero-proof-icon" />
              <small>
                كل مورد يراجعه فريق موية قبل ما يظهر لك.
                <br />
                الدفع عند الاستلام، وبدون رسوم مخفية.
              </small>
            </div>
          </div>
          <DeliveryScene />
        </div>
        <div className="container">
          <div className="quick-order">
            <div className="quick-title">
              <span className="soft-icon">
                <MapPin />
              </span>
              <div>
                <h3>وين تبي الموية توصلك؟</h3>
                <p>حدد مدينتك وخلّ الباقي علينا</p>
              </div>
            </div>
            <label className="quick-city">
              <span>المدينة</span>
              <select
                aria-label="اختر مدينتك"
                value={city}
                disabled={!cities.data}
                onChange={(e) => setCity(e.target.value)}
              >
                {!cities.data && <option value="">جارٍ التحميل…</option>}
                {cities.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="quick-available" aria-live="polite">
              {count === undefined ? (
                <span>نبحث عن موردين في مدينتك…</span>
              ) : count > 0 ? (
                <>
                  <span className="live-dot" />
                  <span>موردون متاحون الآن: {count}</span>
                </>
              ) : (
                <span>لا يوجد موردون متاحون حالياً</span>
              )}
            </div>
            <Button onClick={() => startOrder()}>
              شوف الموردين <ArrowLeft size={18} />
            </Button>
          </div>
        </div>
      </section>
      <section className="trust-strip container">
        {[
          [ShieldCheck, "موردون موثوقون", "موردون معتمدون لخدمتك"],
          [Wallet, "أسعار واضحة", "بدون رسوم مخفية"],
          [Clock3, "وصول سريع", "موية في الوقت اللي تحتاجه"],
          [Navigation, "متابعة الطلب", "معك من الطلب إلى الوصول"],
        ].map(([Icon, title, sub]) => (
          <div key={title}>
            <Icon />
            <div>
              <h4>{title}</h4>
              <p>{sub}</p>
            </div>
          </div>
        ))}
      </section>
      <section id="how-it-works" className="section how-section">
        <div className="container">
          <SectionHeading
            eyebrow="بكل بساطة"
            title="موية عندك في ٣ خطوات"
            description="من أول طلب إلى آخر قطرة، سهّلناها عليك."
          />
          <div className="steps-grid">
            {[
              [
                MapPin,
                "حدد موقعك واحتياجك",
                "اختر موقعك وحجم الوايت ونوع الماء المناسب لخزان منزلك.",
              ],
              [
                Truck,
                "اختر المورد المناسب",
                "قارن الأسعار ووقت الوصول، واختر اللي يناسبك.",
              ],
              [
                BadgeCheck,
                "تابع الطلب حتى الوصول",
                "تتبّع حالة طلبك واستقبل الموية عند بابك، بكل راحة.",
              ],
            ].map(([Icon, title, desc], i) => (
              <article className="how-card" key={title}>
                <div className="step-icon">
                  <Icon size={29} />
                  <span>{["١", "٢", "٣"][i]}</span>
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="suppliers" className="section container">
        <SectionHeading
          eyebrow="شركاء نثق فيهم"
          title="موردون قريبون منك"
          description={`خيارات موثوقة في ${cityName}، وموية على قد احتياجك.`}
          action={
            <button className="text-button" onClick={() => startOrder()}>
              عرض جميع الموردين <ArrowLeft size={17} />
            </button>
          }
        />
        {cities.error ? (
          <ErrorState error={cities.error} onRetry={cities.reload} />
        ) : suppliers.error ? (
          <ErrorState error={suppliers.error} onRetry={suppliers.reload} />
        ) : !suppliers.data ? (
          <LoadingState text="جارٍ تحميل الموردين…" />
        ) : count === 0 ? (
          <NoSuppliers
            cityName={cityName}
            onJoin={() => navigate("supplier/register")}
          />
        ) : (
          <>
            <div className="supplier-grid">
              {suppliers.data.slice(0, 3).map((s) => (
                <SupplierCard key={s.id} supplier={s} onSelect={startOrder} />
              ))}
            </div>
            <p className="data-note">
              الأسعار لوايت ٦ طن مياه عادية، شاملة الضريبة
            </p>
          </>
        )}
      </section>
      <section className="container">
        <div className="partner-banner">
          <div className="partner-art">
            <Truck size={65} strokeWidth={1.3} />
            <span>
              <Check size={18} />
            </span>
          </div>
          <div>
            <span className="eyebrow">كبّر شغلك مع موية</span>
            <h2>عندك وايت؟ خلّ العملاء يوصلون لك.</h2>
            <p>
              انضم لشبكة موردينا، استقبل طلبات أكثر، وأدر شغلك من مكان واحد.
            </p>
          </div>
          <Button onClick={() => navigate("supplier/register")}>
            انضم كمورد <ArrowLeft size={18} />
          </Button>
        </div>
      </section>
      <section className="help-line container">
        <Headphones size={20} />
        <span>نحن هنا نسهّلها عليك</span>
        <a href="mailto:hello@mooyah.example">
          تواصل معنا <ArrowLeft size={15} />
        </a>
        <Sparkles size={17} />
      </section>
    </>
  );
}
