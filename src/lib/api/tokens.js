const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const LEGACY_KEYS = [
  "accessToken",
  "refreshToken",
  "token",
  "jwt",
  "auth_token",
  "authToken",
];

function canUseDOM() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getAccessToken() {
  if (!canUseDOM()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!canUseDOM()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (!canUseDOM()) return;
  if (typeof accessToken === "string") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (typeof refreshToken === "string") {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  if (!canUseDOM()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  for (const k of LEGACY_KEYS) localStorage.removeItem(k);
  // If older builds stored token-like keys, remove them safely.
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (/token|jwt|session/i.test(key)) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const raw of cookies) {
    const name = raw.split("=")[0]?.trim();
    if (!name) continue;
    if (!/token|auth|refresh|access|session/i.test(name)) continue;
    // Cannot clear HttpOnly cookies from JS, but clear what we can.
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

