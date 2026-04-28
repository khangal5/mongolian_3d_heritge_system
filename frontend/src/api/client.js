const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000/api";

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildAuthHeaders()
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Ignore non-JSON error responses.
    }

    throw new Error(message);
  }

  return response.json();
}

async function requestWithOptions(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Ignore non-JSON error responses.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getToken() {
  try {
    const auth = JSON.parse(window.localStorage.getItem("heritage_auth"));
    return auth?.token || null;
  } catch {
    return null;
  }
}

function buildAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getArtifacts(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return request(`/artifacts${suffix}`);
}

export function getArtifactBySlug(slug) {
  return request(`/artifacts/${slug}`);
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
    headers: buildAuthHeaders(),
    body: formData
  });
}

export function uploadArtifactModel(formData) {
  return requestWithOptions("/artifacts/upload-model", {
    method: "POST",
    headers: buildAuthHeaders(),
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
    method: "POST",
    headers: buildAuthHeaders()
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
    method: "POST",
    headers: buildAuthHeaders()
  });
}

export function getAdminResearchers() {
  return request("/auth/admin/researchers");
}

export function verifyResearcherManually(id) {
  return requestWithOptions(`/auth/admin/researchers/${id}/verify`, {
    method: "POST",
    headers: buildAuthHeaders()
  });
}

export function revokeResearcherVerification(id) {
  return requestWithOptions(`/auth/admin/researchers/${id}/revoke`, {
    method: "POST",
    headers: buildAuthHeaders()
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
      "Content-Type": "application/json",
      ...buildAuthHeaders()
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
    method: "POST",
    headers: buildAuthHeaders()
  });
}

export function revertArtifact(slug) {
  return requestWithOptions(`/artifacts/${slug}/revert`, {
    method: "POST",
    headers: buildAuthHeaders()
  });
}

export function updateArtifactRequest(slug, payload) {
  return requestWithOptions(`/artifacts/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
}

export function approveArtifact(slug, note = "") {
  return requestWithOptions(`/artifacts/${slug}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders()
    },
    body: JSON.stringify({ note })
  });
}

export function rejectArtifact(slug, note) {
  return requestWithOptions(`/artifacts/${slug}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders()
    },
    body: JSON.stringify({ note })
  });
}

export function deleteArtifactRequest(slug) {
  return requestWithOptions(`/artifacts/${slug}`, {
    method: "DELETE",
    headers: buildAuthHeaders()
  });
}
