import { Banknote, CheckCheck, ClipboardList, PackageCheck } from "lucide-react";

// The four numbers from GET /api/me/stats. Shows "—" while loading.
export default function StatsCards({ stats }) {
  const value = (v) => (stats ? v : "—");
  const cards = [
    [ClipboardList, value(stats?.pending_count), "طلبات جديدة"],
    [CheckCheck, value(stats?.delivered_today_count), "طلبات مكتملة اليوم"],
    [Banknote, value(`${stats?.revenue_today_sar} ر.س`), "إيرادات اليوم"],
    [PackageCheck, value(stats?.delivered_total_count), "إجمالي الطلبات المكتملة"],
  ];
  return (
    <div className="stats-grid">
      {cards.map(([Icon, number, label]) => (
        <article className="stat-card" key={label}>
          <Icon size={22} aria-hidden="true" />
          <strong>{number}</strong>
          <span>{label}</span>
        </article>
      ))}
    </div>
  );
}
