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
import { cities, suppliers } from "../data/mock";
export default function Home({ navigate, city, setCity, startOrder }) {
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
              <Button secondary onClick={() => navigate("dashboard")}>
                انضم كمورد <Truck size={19} />
              </Button>
            </div>
            <div className="hero-proof">
              <div className="avatars">
                <span>م</span>
                <span>ع</span>
                <span>ف</span>
                <span>ن</span>
              </div>
              <div>
                <div className="stars">★★★★★</div>
                <small>
                  أكثر من <b>٢,٥٠٠</b> عميل يثقون في موية{" "}
                  <span className="demo-inline">· بيانات تجريبية</span>
                </small>
              </div>
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
                onChange={(e) => setCity(e.target.value)}
              >
                {Object.keys(cities).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="quick-available">
              <span className="live-dot" />
              <span>موردون متاحون بالقرب منك</span>
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
                "قارن الأسعار والتقييمات ووقت الوصول، واختر اللي يناسبك.",
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
          description={`خيارات موثوقة في ${city}، وموية على قد احتياجك.`}
          action={
            <button className="text-button" onClick={() => startOrder()}>
              عرض جميع الموردين <ArrowLeft size={17} />
            </button>
          }
        />
        <div className="supplier-grid">
          {suppliers.slice(0, 3).map((s) => (
            <SupplierCard key={s.id} supplier={s} onSelect={startOrder} />
          ))}
        </div>
        <p className="data-note">
          أسعار توضيحية لوايت ٦ طن · جميع الموردين والتقييمات بيانات تجريبية
        </p>
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
          <Button onClick={() => navigate("dashboard")}>
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
