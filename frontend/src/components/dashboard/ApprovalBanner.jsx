import { CircleAlert, Clock3 } from "lucide-react";

// Shown under the dashboard heading when the account is not approved yet.
// The texts are exactly the ones in the Requirements (F14).
const TEXTS = {
  pending: "حسابك قيد المراجعة. بتظهر للعملاء بعد موافقة فريق موية.",
  rejected: "لم تتم الموافقة على حسابك. تواصل مع فريق موية.",
};

export default function ApprovalBanner({ status, onEditProfile }) {
  if (status === "approved") return null;
  const Icon = status === "rejected" ? CircleAlert : Clock3;
  return (
    <div className={`approval-banner ${status}`} role="status">
      <Icon size={22} aria-hidden="true" />
      <div>
        <strong>{status === "rejected" ? "لم تتم الموافقة" : "قيد المراجعة"}</strong>
        <p>{TEXTS[status]}</p>
      </div>
      <button type="button" className="text-button" onClick={onEditProfile}>
        بياناتي وأسعاري
      </button>
    </div>
  );
}
