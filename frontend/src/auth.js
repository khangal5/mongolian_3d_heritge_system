const AUTH_STORAGE_KEY = "heritage_auth";

export function getStoredAuth() {
  try {
    const value = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth) {
  const payload = auth?.user ? { user: auth.user } : null;
  if (payload) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function updateStoredUser(user) {
  if (!user) {
    return null;
  }
  const next = { user };
  setStoredAuth(next);
  return next;
}
