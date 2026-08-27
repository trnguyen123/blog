import apiFetch from './httpClient';

export const userAdminService = {
  getAll: () => apiFetch('/admin/users', { method: 'GET' }),

  getById: (userId) => apiFetch(`/admin/users/${userId}`, { method: 'GET' }),

  updateStatus: (userId, status) =>
    apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (userId) =>
    apiFetch(`/admin/users/${userId}`, { method: 'DELETE' }),

  assignRole: (userId, role) =>
    apiFetch(`/admin/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  removeRole: (userId, role) =>
    apiFetch(`/admin/users/${userId}/roles/${role}`, { method: 'DELETE' }),
};