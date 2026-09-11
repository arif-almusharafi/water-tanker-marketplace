export const cities = {
  الرياض: ["النرجس", "الياسمين", "الملقا", "العقيق"],
  جدة: ["الصفا", "الروضة", "أبحر الشمالية"],
  الدمام: ["الشاطئ", "الفيصلية", "النور"],
};
export const suppliers = [
  {
    id: 1,
    name: "مياه النقاء",
    subtitle: "نقاء تثق به، وخدمة تستحقها",
    rating: "4.9",
    orders: 1240,
    distance: "2.4",
    eta: 25,
    price: 120,
    color: "blue",
    available: true,
    driver: "عبدالله القحطاني",
  },
  {
    id: 2,
    name: "وايت الخير",
    subtitle: "موية لمنزلك، في الوقت المناسب",
    rating: "4.8",
    orders: 986,
    distance: "3.1",
    eta: 35,
    price: 110,
    color: "cyan",
    available: true,
    driver: "محمد العتيبي",
  },
  {
    id: 3,
    name: "مياه الندى",
    subtitle: "جودة في كل قطرة",
    rating: "4.9",
    orders: 2150,
    distance: "4.6",
    eta: 40,
    price: 130,
    color: "navy",
    available: true,
    driver: "خالد الدوسري",
  },
  {
    id: 4,
    name: "صهاريج الرواء",
    subtitle: "خدمة موثوقة لكل احتياج",
    rating: "4.7",
    orders: 765,
    distance: "5.2",
    eta: 50,
    price: 115,
    color: "cyan",
    available: true,
    driver: "سعد الغامدي",
  },
];
export const statuses = [
  "تم استلام الطلب",
  "وافق المورد",
  "الوايت في الطريق",
  "وصل إلى الموقع",
  "تم التسليم",
];
export const incomingOrders = [
  {
    id: 3102,
    name: "أحمد العتيبي",
    area: "النرجس",
    capacity: 12,
    distance: "2.4",
    price: 210,
    time: "في أقرب وقت",
  },
  {
    id: 3103,
    name: "نورة الدوسري",
    area: "الياسمين",
    capacity: 6,
    distance: "3.1",
    price: 120,
    time: "في أقرب وقت",
  },
  {
    id: 3104,
    name: "فهد القحطاني",
    area: "الملقا",
    capacity: 18,
    distance: "4.8",
    price: 300,
    time: "اليوم، ٤:٣٠ م",
  },
];
export function getPrice(supplier, capacity, water) {
  return (
    supplier.price + (Number(capacity) - 6) * 15 + (water === "شرب" ? 30 : 0)
  );
}
