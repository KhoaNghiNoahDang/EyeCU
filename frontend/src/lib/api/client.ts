const API_URL = "https://eyecu.onrender.com/api";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem("eyecu_token");

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let body = options.body;

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    if (body && typeof body === "object") {
      body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    body,
    headers,
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMsg =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch (e) {
      // Ignore json parse error
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses
  if (response.status === 204) return null;

  return response.json();
}
