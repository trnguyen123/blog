import apiFetch from './httpClient';

export const categoryService = {
  getAll: () =>
    apiFetch('/categories', { method: 'GET' }),

  getById: (id) =>
    apiFetch(`/categories/${id}`, { method: 'GET' }),

  create: (payload) =>
    apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiFetch(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    apiFetch(`/categories/${id}`, {
      method: 'DELETE',
    }),
};