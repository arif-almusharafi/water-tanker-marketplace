// The one place that talks to the backend.
// Every path and field name here follows docs/api-contract.md exactly.

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8100"
).replace(/\/+$/, "");

const TOKEN_KEY = "mooyah_supplier_token";
const LAST_ORDER_KEY = "mooyah_last_order";

export const NETWORK_ERROR_MESSAGE = "تعذر الاتصال بالخادم، حاول مرة ثانية";

// An error from the API, in the contract's error shape.
// `status` is the HTTP status (0 when the server could not be reached).
export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// ---------- Browser storage ----------

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getLastOrderRef = () => localStorage.getItem(LAST_ORDER_KEY);
export const saveLastOrderRef = (ref) =>
  localStorage.setItem(LAST_ORDER_KEY, ref);

// ---------- Low level request ----------

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = `Bearer ${getToken()}`;

  let response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network_error", NETWORK_ERROR_MESSAGE);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (response.ok) return data;

  // Any 401 on a supplier request means the token is no longer valid.
  if (response.status === 401 && auth) clearToken();

  const error = data?.error;
  throw new ApiError(
    response.status,
    error?.code || "server_error",
    error?.message || NETWORK_ERROR_MESSAGE,
    error?.fields || {},
  );
}

// ---------- Public endpoints (customers) ----------

export const getCities = () =>
  request("/api/cities").then((data) => data.items);

export const getSuppliers = (cityId) =>
  request(`/api/suppliers?city_id=${encodeURIComponent(cityId)}`).then(
    (data) => data.items,
  );

export const createOrder = (order) =>
  request("/api/orders", { method: "POST", body: order });

export const getOrder = (reference) =>
  request(`/api/orders/${encodeURIComponent(reference)}`);

export const cancelOrder = (reference) =>
  request(`/api/orders/${encodeURIComponent(reference)}/cancel`, {
    method: "POST",
  });

// ---------- Supplier account ----------

export const registerSupplier = (supplier) =>
  request("/api/auth/register", { method: "POST", body: supplier });

export const loginSupplier = (phone, password) =>
  request("/api/auth/login", { method: "POST", body: { phone, password } });

export const logoutSupplier = () =>
  request("/api/auth/logout", { method: "POST", auth: true });

export const getMe = () => request("/api/me", { auth: true });

export const updateMe = (changes) =>
  request("/api/me", { method: "PATCH", body: changes, auth: true });

// group is "incoming", "active", or "history".
export const getMyOrders = (group) =>
  request(`/api/me/orders?group=${group}`, { auth: true }).then(
    (data) => data.items,
  );

export const setMyOrderStatus = (reference, status) =>
  request(`/api/me/orders/${encodeURIComponent(reference)}/status`, {
    method: "POST",
    body: { status },
    auth: true,
  });

export const getMyStats = () => request("/api/me/stats", { auth: true });
