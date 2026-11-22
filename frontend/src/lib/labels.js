// Arabic labels for the fixed values in the API contract.

export const CAPACITIES = [6, 12, 18];

export const WATER_TYPES = {
  regular: "مياه عادية",
  drinking: "مياه شرب",
};

export const DELIVERY_TIMES = {
  asap: "في أقرب وقت",
  scheduled: "جدولة لوقت لاحق",
};

export const PAYMENT_METHODS = {
  cash: "نقداً عند الاستلام",
  card: "شبكة / مدى عند الاستلام",
};

export const ORDER_STATUS_LABELS = {
  pending: "تم استلام الطلب",
  accepted: "وافق المورد",
  on_the_way: "الوايت في الطريق",
  arrived: "وصل إلى الموقع",
  delivered: "تم التسليم",
  rejected: "رفض المورد الطلب",
  cancelled: "ملغي",
};

// The five steps of the tracking timeline, in order.
// "rejected" and "cancelled" are not steps.
export const TIMELINE = ["pending", "accepted", "on_the_way", "arrived", "delivered"];

// Final statuses never change again, so the pages stop refreshing.
export const FINAL_STATUSES = ["delivered", "rejected", "cancelled"];

// Short result words for the supplier history list.
export const HISTORY_RESULT = {
  delivered: "مكتمل",
  rejected: "مرفوض",
  cancelled: "ملغي",
};
