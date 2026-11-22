import { CreditCard, LockKeyhole, Wallet } from "lucide-react";
import { etaRange, formatDateTime, supplierPrice } from "../../lib/format";
import { PAYMENT_METHODS, WATER_TYPES } from "../../lib/labels";

const PAYMENT_ICONS = { cash: Wallet, card: CreditCard };

// Order step 4: the summary and the payment method.
// The price here uses the same rule as the server.
export default function SummaryStep({ form, city, district, supplier, update }) {
  return (
    <>
      <dl className="summary-list">
        <div>
          <dt>عنوان التوصيل</dt>
          <dd>
            {city.name}، {district.name}
            <small>{form.address}</small>
          </dd>
        </div>
        <div>
          <dt>بيانات التواصل</dt>
          <dd>
            {form.customer_name}
            <small dir="ltr">{form.customer_phone}</small>
          </dd>
        </div>
        <div>
          <dt>حجم الوايت / نوع الماء</dt>
          <dd>
            {form.capacity_tons} طن · {WATER_TYPES[form.water_type]}
          </dd>
        </div>
        <div>
          <dt>المورد</dt>
          <dd>{supplier.name}</dd>
        </div>
        <div>
          <dt>وقت التوصيل</dt>
          <dd>
            {form.delivery_time === "asap"
              ? `خلال ${etaRange(supplier.eta_minutes)}`
              : formatDateTime(form.schedule)}
          </dd>
        </div>
        {form.notes.trim() && (
          <div>
            <dt>ملاحظات</dt>
            <dd>{form.notes}</dd>
          </div>
        )}
        <div className="total-row">
          <dt>الإجمالي شامل الضريبة</dt>
          <dd>
            {supplierPrice(supplier, form.capacity_tons, form.water_type)} ر.س
          </dd>
        </div>
      </dl>
      <fieldset>
        <legend>طريقة الدفع</legend>
        <div className="payment-options">
          {Object.entries(PAYMENT_METHODS).map(([value, label]) => {
            const Icon = PAYMENT_ICONS[value];
            return (
              <label
                key={value}
                className={`payment-choice ${form.payment_method === value ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={form.payment_method === value}
                  onChange={() => update("payment_method", value)}
                />
                <Icon size={22} />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="demo-notice">
        <LockKeyhole size={17} /> الدفع عند الاستلام للسائق. ما نطلب منك أي
        بيانات بطاقة.
      </p>
    </>
  );
}
