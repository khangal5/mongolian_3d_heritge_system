const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000/api";

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
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
    if (value) {
      search.set(key, value);
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
