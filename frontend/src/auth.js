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
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function updateStoredUser(user) {
  const current = getStoredAuth();
  if (!current) {
    return null;
  }
  const next = { ...current, user };
  setStoredAuth(next);
  return next;
}

