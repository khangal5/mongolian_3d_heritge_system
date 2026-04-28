const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000/api";

const DEFAULT_FETCH_OPTIONS = {
  credentials: "include"
};

function buildError(response, message) {
  const error = new Error(message);
  error.status = response.status;
  return error;
}

function networkError() {
  const error = new Error(
    "Сервертэй холбогдож чадсангүй. Backend ажиллаж байгаа эсэхээ шалгана уу."
  );
  error.status = 0;
  error.isNetworkError = true;
  return error;
}

async function request(path) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, DEFAULT_FETCH_OPTIONS);
  } catch {
    throw networkError();
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Ignore non-JSON error responses.
    }

    throw buildError(response, message);
  }

  return response.json();
}

async function requestWithOptions(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...DEFAULT_FETCH_OPTIONS,
      ...options
    });
  } catch {
    throw networkError();
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Ignore non-JSON error responses.
    }

    throw buildError(response, message);
  }

  const method = (options?.method || "GET").toUpperCase();
  if (method !== "GET") {
    cache.clear();
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const cache = new Map();
const CACHE_TTL_MS = 15000;

function fromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function intoCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache() {
  cache.clear();
}

export async function getArtifacts(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const cacheKey = `artifacts:${suffix}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const data = await request(`/artifacts${suffix}`);
  intoCache(cacheKey, data);
  return data;
}

export async function getArtifactBySlug(slug) {
  const cacheKey = `artifact:${slug}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;
  const data = await request(`/artifacts/${slug}`);
  intoCache(cacheKey, data);
  return data;
}

export function getReconstructionJobs() {
  return request("/reconstruction-jobs");
}

export function getReconstructionJobById(id) {
  return request(`/reconstruction-jobs/${id}`);
}

export function uploadReconstructionJob(formData) {
  return requestWithOptions("/reconstruction-jobs/upload", {
    method: "POST",
    body: formData
  });
}

export function uploadArtifactModel(formData) {
  return requestWithOptions("/artifacts/upload-model", {
    method: "POST",
    body: formData
  });
}

export function registerResearcher(payload) {
  return requestWithOptions("/auth/register-researcher", {
    method: "POST",
    body: payload
  });
}

export function login(payload) {
  return requestWithOptions("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function getCurrentUser() {
  return request("/auth/me");
}

export function logout() {
  return requestWithOptions("/auth/logout", {
    method: "POST"
  });
}

export function forgotPassword(email) {
  return requestWithOptions("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
}

export function resetPassword(token, password) {
  return requestWithOptions("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  });
}

export function verifyEmail(token) {
  return requestWithOptions("/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
}

export function resendVerificationEmail() {
  return requestWithOptions("/auth/resend-verification", {
    method: "POST"
  });
}

export function getAdminResearchers() {
  return request("/auth/admin/researchers");
}

export function verifyResearcherManually(id) {
  return requestWithOptions(`/auth/admin/researchers/${id}/verify`, {
    method: "POST"
  });
}

export function revokeResearcherVerification(id) {
  return requestWithOptions(`/auth/admin/researchers/${id}/revoke`, {
    method: "POST"
  });
}

export function buildUploadUrl(pathname) {
  if (!pathname) return null;
  if (pathname.startsWith("http")) return pathname;
  return `${API_BASE_URL.replace(/\/api$/, "")}${pathname}`;
}

export function createArtifactRequest(payload) {
  return requestWithOptions("/artifacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function getMyArtifacts() {
  return request("/artifacts/mine");
}

export function getAdminQueue(status = "PENDING") {
  const search = new URLSearchParams({ status });
  return request(`/artifacts/admin/queue?${search.toString()}`);
}

export function submitArtifact(slug) {
  return requestWithOptions(`/artifacts/${slug}/submit`, {
    method: "POST"
  });
}

export function revertArtifact(slug) {
  return requestWithOptions(`/artifacts/${slug}/revert`, {
    method: "POST"
  });
}

export function updateArtifactRequest(slug, payload) {
  return requestWithOptions(`/artifacts/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function approveArtifact(slug, note = "") {
  return requestWithOptions(`/artifacts/${slug}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ note })
  });
}

export function rejectArtifact(slug, note) {
  return requestWithOptions(`/artifacts/${slug}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ note })
  });
}

export function deleteArtifactRequest(slug) {
  return requestWithOptions(`/artifacts/${slug}`, {
    method: "DELETE"
  });
}
