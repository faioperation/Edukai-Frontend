import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./tokens";

function getBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function buildUrl(baseUrl, path, params) {
  if (path?.startsWith("http://") || path?.startsWith("https://")) {
    const urlObj = new URL(path);
    if (params && typeof params === "object") {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        urlObj.searchParams.set(k, String(v));
      }
    }
    return urlObj.toString();
  }

  const base = (baseUrl || "").endsWith("/") ? baseUrl : `${baseUrl}/`;
  const cleanPath = (path || "").replace(/^\/+/, ""); // keep base path (e.g. ".../api/")
  const urlObj = new URL(cleanPath, base || "http://dummy-base/");

  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      urlObj.searchParams.set(k, String(v));
    }
  }

  // If baseUrl was empty we return relative path.
  if (!baseUrl) {
    return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
  }

  return urlObj.toString();
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildError({ status, data, url }) {
  const message =
    (typeof data === "string" && data) ||
    data?.message ||
    data?.error ||
    `Request failed (${status})`;
  const err = new Error(message);
  err.status = status;
  err.data = data;
  err.url = url;
  return err;
}

let refreshPromise = null;
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      throw new Error("No refresh token available");
    }

    const url = buildUrl(getBaseUrl(), "/auth/refresh");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      clearTokens();
      throw buildError({ status: res.status, data, url });
    }

    // Expected response shape (recommended):
    // { accessToken: "...", refreshToken?: "..." }
    if (!data?.accessToken) {
      clearTokens();
      throw new Error("Refresh did not return accessToken");
    }
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    params,
    body,
    headers,
    auth = true,
    retryOnUnauthorized = true,
    signal,
    baseUrl = getBaseUrl(),
    credentials = "include",
  } = options;

  const url = buildUrl(baseUrl, path || "/", params);

  const finalHeaders = new Headers(headers || {});
  if (!finalHeaders.has("Accept")) finalHeaders.set("Accept", "application/json");

  let payload = body;
  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(typeof body === "string")
  ) {
    if (!finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: method === "GET" || method === "HEAD" ? undefined : payload,
    signal,
    credentials,
  });

  if (res.status === 401 && auth && retryOnUnauthorized) {
    await refreshAccessToken();
    return apiRequest(path, { ...options, retryOnUnauthorized: false });
  }

  const data = await safeJson(res);
  if (!res.ok) throw buildError({ status: res.status, data, url });
  return data;
}

export const apiGet = (path, options) =>
  apiRequest(path, { ...(options || {}), method: "GET" });
export const apiDelete = (path, options) =>
  apiRequest(path, { ...(options || {}), method: "DELETE" });
export const apiPost = (path, body, options) =>
  apiRequest(path, { ...(options || {}), method: "POST", body });
export const apiPut = (path, body, options) =>
  apiRequest(path, { ...(options || {}), method: "PUT", body });
export const apiPatch = (path, body, options) =>
  apiRequest(path, { ...(options || {}), method: "PATCH", body });

