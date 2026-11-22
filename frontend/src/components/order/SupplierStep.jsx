import { SupplierCard } from "../UI";
import { ErrorState, LoadingState, NoSuppliers } from "../States";
import { supplierPrice } from "../../lib/format";

// Order step 3: approved, available suppliers in the order's city.
// `suppliers` is the API state { data, error, loading, reload }.
export default function SupplierStep({ suppliers, chosen, choose, form, cityName, onJoin }) {
  if (suppliers.error)
    return <ErrorState error={suppliers.error} onRetry={suppliers.reload} />;
  if (!suppliers.data) return <LoadingState text="جارٍ تحميل الموردين…" />;
  if (suppliers.data.length === 0)
    return <NoSuppliers cityName={cityName} onJoin={onJoin} />;
  return (
    <div className="order-suppliers">
      {suppliers.data.map((s) => (
        <SupplierCard
          key={s.id}
          supplier={s}
          selected={chosen?.id === s.id}
          price={supplierPrice(s, form.capacity_tons, form.water_type)}
          onSelect={(s) => choose(s.id)}
        />
      ))}
    </div>
  );
}
