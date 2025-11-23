import { useAuthStore } from "./authStore";

export const API_BASE_URL = '/api/';
// export const API_BASE_URL = 'http://localhost:8000/api/';
// export const API_BASE_URL = 'https://urchin-app-dz8au.ondigitalocean.app/api/';

// Safely parse response body as JSON or text (no throw on empty/invalid JSON)
const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch {
    return null;
  }
};

const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return token ? `Bearer ${token}` : null;
};

const handleResponse = async (response, success, error) => {
  const payload = await parseResponseBody(response);

  if (response.ok) {
    if (success) success(payload);
    return payload;
  } else if (response.status === 401) {
    useAuthStore.getState().logout();
    const errorMessage = 'Unauthorized';
    if (error) error(errorMessage); // keep existing callback contract
    const err = new Error(errorMessage);
    err.status = 401;
    throw err;
  } else {
    // Try to derive a useful message from payload or status text
    const message =
      (payload && (payload.message || payload.error || payload.errors?.[0])) ||
      response.statusText ||
      'Request failed';

    if (error) error(payload || {}); // keep existing callback contract (object)
    const err = new Error(message);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
};

// Helper function to build query string
const buildQueryString = (params) => {
  if (!params) return '';
  const query = Object.entries(params)
    .filter(([key, value]) => value != null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query ? `?${query}` : '';
};

// Helper function to detect if body contains files
const hasFiles = (obj) => {
  if (obj instanceof FormData) return true;
  if (obj instanceof File || obj instanceof Blob) return true;
  
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(value => {
      if (value instanceof File || value instanceof Blob) return true;
      if (value instanceof FileList) return true;
      if (Array.isArray(value)) {
        return value.some(item => item instanceof File || item instanceof Blob);
      }
      if (typeof value === 'object' && value !== null) {
        return hasFiles(value);
      }
      return false;
    });
  }
  return false;
};

// Helper function to convert object to FormData
const objectToFormData = (obj, formData = new FormData(), parentKey = '') => {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const formKey = parentKey ? `${parentKey}[${key}]` : key;
    
    if (value instanceof File || value instanceof Blob) {
      formData.append(formKey, value);
    } else if (value instanceof FileList) {
      Array.from(value).forEach((file, index) => {
        formData.append(`${formKey}[${index}]`, file);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File || item instanceof Blob) {
          formData.append(`${formKey}[${index}]`, item);
        } else if (typeof item === 'object' && item !== null) {
          objectToFormData(item, formData, `${formKey}[${index}]`);
        } else {
          formData.append(`${formKey}[${index}]`, item);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      objectToFormData(value, formData, formKey);
    } else if (value !== null && value !== undefined) {
      formData.append(formKey, value);
    }
  });
  return formData;
};

const apiFetch = async (
  url,
  { method = 'GET', body = null, auth = true, success = null, error = null, forceFormData = false } = {}
) => {
  const headers = { Accept: 'application/json' };

  if (auth) {
    const token = getAuthToken();
    if (!token) {
      const errorMessage = 'Unauthorized';
      if (error) error(errorMessage);
      throw new Error(errorMessage);
    }
    headers['Authorization'] = token;
  }

  let processedBody = body;
  
  if (body) {
    if (body instanceof FormData) {
      processedBody = body;
    } else if (forceFormData || hasFiles(body)) {
      processedBody = objectToFormData(body);
    } else {
      headers['Content-Type'] = 'application/json';
      processedBody = JSON.stringify(body);
    }
  }

  // Normalize URL to avoid duplicate/missing slashes
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = String(url).replace(/^\/+/, '');
  const endpoint = `${base}/${path}`;

  const response = await fetch(endpoint, {
    method,
    headers,
    body: processedBody,
  });

  return handleResponse(response, success, error);
};

export const api = {
  get: (url, {params=null, ...options} = {}) =>
    apiFetch(`${url}${buildQueryString(params)}`, { ...options, method: 'GET' }),
  post: (url, body, options = {}) =>
    apiFetch(url, { ...options, method: 'POST', body }),
  put: (url, body, options = {}) =>
    apiFetch(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options = {}) =>
    apiFetch(url, { ...options, method: 'PATCH', body }),
  delete: (url, options = {}) =>
    apiFetch(url, { ...options, method: 'DELETE' }),
  
  // Convenience methods for explicit multipart requests
  postFormData: (url, body, options = {}) =>
    apiFetch(url, { ...options, method: 'POST', body, forceFormData: true }),
  putFormData: (url, body, options = {}) =>
    apiFetch(url, { ...options, method: 'PUT', body, forceFormData: true }),
  patchFormData: (url, body, options = {}) =>
    apiFetch(url, { ...options, method: 'PATCH', body, forceFormData: true }),
};
