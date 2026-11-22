// A small fake of the backend, used ONLY by the Playwright tests.
// It answers every request to "/api/..." inside the browser, following
// docs/api-contract.md, so the tests do not need the real backend.
// The app code itself has no fake data.

const CITIES = [
  {
    id: "riyadh",
    name: "الرياض",
    districts: [
      { id: "al-narjis", name: "النرجس" },
      { id: "al-yasmin", name: "الياسمين" },
      { id: "al-malqa", name: "الملقا" },
      { id: "al-aqiq", name: "العقيق" },
    ],
  },
  {
    id: "jeddah",
    name: "جدة",
    districts: [
      { id: "al-safa", name: "الصفا" },
      { id: "al-rawdah", name: "الروضة" },
      { id: "north-obhur", name: "أبحر الشمالية" },
    ],
  },
  {
    id: "dammam",
    name: "الدمام",
    districts: [
      { id: "al-shati", name: "الشاطئ" },
      { id: "al-faisaliyah", name: "الفيصلية" },
      { id: "al-noor", name: "النور" },
    ],
  },
];

// A supplier with SupplierPrivate fields plus a password and a token.
export function makeSupplier(id, overrides = {}) {
  return {
    id,
    name: `مورد ${id}`,
    tagline: "موية نقية لبيتك",
    city_id: "riyadh",
    eta_minutes: 20 + id * 5,
    prices_sar: { 6: 100 + id * 10, 12: 180 + id * 10, 18: 260 + id * 10 },
    drinking_extra_sar: 30,
    phone: `050000000${id}`,
    driver_name: `سائق ${id}`,
    is_available: true,
    approval_status: "approved",
    created_at: "2026-11-01T09:00:00Z",
    password: "secret-pass",
    token: `token-${id}`,
    ...overrides,
  };
}

const PUBLIC_FIELDS = [
  "id",
  "name",
  "tagline",
  "city_id",
  "eta_minutes",
  "prices_sar",
  "drinking_extra_sar",
];

const error = (status, code, message, fields = {}) => ({
  status,
  body: { error: { code, message, fields } },
});

export function createFakeApi({ suppliers = [], orders = [], down = false } = {}) {
  const state = { suppliers, orders, down, requests: [], nextRef: 1 };

  const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
  const deliveredCount = (id) =>
    state.orders.filter((o) => o.supplier_id === id && o.status === "delivered").length;
  const publicSupplier = (s) => ({
    ...pick(s, PUBLIC_FIELDS),
    delivered_orders_count: deliveredCount(s.id),
  });
  const privateSupplier = (s) => {
    const { password: _p, token: _t, ...rest } = s;
    return { ...rest, delivered_orders_count: deliveredCount(s.id) };
  };
  const visible = (s) => s.approval_status === "approved" && s.is_available;
  const supplierOf = (o) => state.suppliers.find((s) => s.id === o.supplier_id);
  const findOrder = (ref) =>
    state.orders.find((o) => o.reference === ref.trim().toUpperCase());

  function customerOrder(o) {
    const s = supplierOf(o);
    const { customer_name: _n, customer_phone: _p, supplier_id: _s, delivered_at: _d, ...rest } = o;
    return {
      ...rest,
      supplier: {
        id: s.id,
        name: s.name,
        driver_name: s.driver_name,
        eta_minutes: s.eta_minutes,
        phone: ["accepted", "on_the_way", "arrived"].includes(o.status) ? s.phone : null,
      },
    };
  }
  function supplierOrder(o) {
    const { supplier_id: _s, ...rest } = o;
    return rest;
  }

  function placeOrder(body) {
    const s = state.suppliers.find((x) => x.id === body.supplier_id);
    if (!s) return error(404, "supplier_not_found", "المورد غير موجود");
    if (!visible(s))
      return error(409, "supplier_unavailable", "المورد غير متاح حالياً، اختر مورداً آخر");
    const city = CITIES.find((c) => c.id === body.city_id);
    const district = city.districts.find((d) => d.id === body.district_id);
    const now = new Date().toISOString();
    const order = {
      ...body,
      reference: `MW-TEST${String(state.nextRef++).padStart(4, "0")}`,
      status: "pending",
      city_name: city.name,
      district_name: district.name,
      price_sar:
        s.prices_sar[body.capacity_tons] +
        (body.water_type === "drinking" ? s.drinking_extra_sar : 0),
      delivered_at: null,
      created_at: now,
      updated_at: now,
    };
    state.orders.push(order);
    return { status: 201, body: customerOrder(order) };
  }

  function stats(me) {
    const mine = state.orders.filter((o) => o.supplier_id === me.id);
    const delivered = mine.filter((o) => o.status === "delivered");
    const revenue = delivered.reduce((sum, o) => sum + o.price_sar, 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() + 3 * 3600000 - i * 86400000).toISOString().slice(0, 10);
      days.push({ date, revenue_sar: i === 0 ? revenue : 0 });
    }
    return {
      pending_count: mine.filter((o) => o.status === "pending").length,
      active_count: mine.filter((o) => ["accepted", "on_the_way", "arrived"].includes(o.status)).length,
      delivered_today_count: delivered.length,
      revenue_today_sar: revenue,
      delivered_total_count: delivered.length,
      revenue_last_7_days: days,
    };
  }

  // Answers for /api/me... endpoints. `me` is the logged-in supplier.
  function meRoutes(me, method, path, query, body) {
    if (path === "/api/me" && method === "GET") return { status: 200, body: privateSupplier(me) };
    if (path === "/api/me" && method === "PATCH") {
      for (const key of ["name", "tagline", "driver_name", "eta_minutes", "prices_sar", "drinking_extra_sar", "is_available"])
        if (key in body) me[key] = body[key];
      return { status: 200, body: privateSupplier(me) };
    }
    if (path === "/api/me/orders") {
      const groups = {
        incoming: ["pending"],
        active: ["accepted", "on_the_way", "arrived"],
        history: ["delivered", "rejected", "cancelled"],
      };
      const items = state.orders
        .filter((o) => o.supplier_id === me.id && groups[query.get("group")].includes(o.status))
        .map(supplierOrder);
      return { status: 200, body: { items } };
    }
    if (path === "/api/me/stats") return { status: 200, body: stats(me) };
    const statusMatch = path.match(/^\/api\/me\/orders\/(.+)\/status$/);
    if (statusMatch) {
      const order = findOrder(decodeURIComponent(statusMatch[1]));
      if (!order || order.supplier_id !== me.id) return error(404, "order_not_found", "الطلب غير موجود");
      order.status = body.status;
      if (body.status === "delivered") order.delivered_at = new Date().toISOString();
      return { status: 200, body: supplierOrder(order) };
    }
    return error(404, "not_found", "غير موجود");
  }

  function answer(method, path, query, body, headers) {
    if (path === "/api/cities") return { status: 200, body: { items: CITIES } };
    if (path === "/api/suppliers") {
      const items = state.suppliers
        .filter((s) => s.city_id === query.get("city_id") && visible(s))
        .map(publicSupplier);
      return { status: 200, body: { items } };
    }
    if (path === "/api/orders" && method === "POST") return placeOrder(body);
    const orderMatch = path.match(/^\/api\/orders\/([^/]+)(\/cancel)?$/);
    if (orderMatch) {
      const order = findOrder(decodeURIComponent(orderMatch[1]));
      if (!order) return error(404, "order_not_found", "ما لقينا طلب بهذا الرقم");
      if (orderMatch[2]) {
        if (!["pending", "accepted"].includes(order.status))
          return error(409, "cannot_cancel", "ما يمكن إلغاء الطلب بعد ما طلع الوايت");
        order.status = "cancelled";
      }
      return { status: 200, body: customerOrder(order) };
    }
    if (path === "/api/auth/register") {
      if (state.suppliers.some((s) => s.phone === body.phone))
        return error(409, "phone_taken", "رقم الجوال مسجل من قبل", {
          phone: "رقم الجوال مسجل من قبل",
        });
      const s = makeSupplier(state.suppliers.length + 1, {
        ...body,
        approval_status: "pending",
        is_available: true,
        token: `token-new-${state.suppliers.length + 1}`,
      });
      state.suppliers.push(s);
      return { status: 201, body: { token: s.token, supplier: privateSupplier(s) } };
    }
    if (path === "/api/auth/login") {
      const s = state.suppliers.find((x) => x.phone === body.phone && x.password === body.password);
      if (!s) return error(401, "invalid_credentials", "رقم الجوال أو كلمة المرور غير صحيحة");
      return { status: 200, body: { token: s.token, supplier: privateSupplier(s) } };
    }
    // Everything below needs a valid token.
    const token = (headers.authorization || "").replace("Bearer ", "");
    const me = state.suppliers.find((s) => s.token === token);
    if (!me) return error(401, "not_authenticated", "سجل دخولك من جديد");
    if (path === "/api/auth/logout") return { status: 204, body: null };
    return meRoutes(me, method, path, query, body);
  }

  async function handle(route) {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (state.down) return route.abort("connectionrefused");
    const body = request.postData() ? JSON.parse(request.postData()) : {};
    state.requests.push({ method, path: url.pathname, body });
    const result = answer(method, url.pathname, url.searchParams, body, request.headers());
    return route.fulfill({
      status: result.status,
      headers: cors,
      contentType: "application/json",
      body: result.body === null ? "" : JSON.stringify(result.body),
    });
  }

  return {
    state,
    // Catches only API calls (paths that start with /api/), not app files.
    install: (page) => page.route((url) => url.pathname.startsWith("/api/"), handle),
  };
}
