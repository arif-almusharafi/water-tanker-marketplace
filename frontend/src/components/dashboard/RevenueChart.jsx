import { BarChart3 } from "lucide-react";
import { weekdayName } from "../../lib/format";

const MAX_BAR_PX = 140;

// "إيرادات الأسبوع": revenue_last_7_days from GET /api/me/stats.
// The last day is today (Riyadh time).
export default function RevenueChart({ days }) {
  const max = Math.max(0, ...(days || []).map((d) => d.revenue_sar));
  return (
    <section className="form-panel dashboard-panel">
      <div className="tracking-heading">
        <h2>إيرادات الأسبوع</h2>
        <span className="muted small">ر.س · آخر 7 أيام</span>
      </div>
      {max === 0 ? (
        <div className="inline-empty">
          <BarChart3 size={28} />
          <p>ما فيه إيرادات في آخر 7 أيام. تظهر هنا بعد أول توصيل مكتمل.</p>
        </div>
      ) : (
        <div className="chart">
          {days.map((d, i) => {
            const isToday = i === days.length - 1;
            return (
              <div className={`chart-column ${isToday ? "today" : ""}`} key={d.date}>
                <span>{d.revenue_sar}</span>
                <div
                  style={{ height: `${Math.round((d.revenue_sar / max) * MAX_BAR_PX)}px` }}
                />
                <small>{isToday ? "اليوم" : weekdayName(d.date)}</small>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
