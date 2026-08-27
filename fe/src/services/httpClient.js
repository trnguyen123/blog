const API_BASE_URL = 'http://localhost:8000/api';

function getToken() {
  try {
    const authRaw = localStorage.getItem('inkwell-auth');
    const authData = authRaw ? JSON.parse(authRaw) : null;
    return authData?.token || null;
  } catch (e) {
    return null;
  }
}

async function apiFetch(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Request failed');
  }

  return result.data;
}

export default apiFetch;