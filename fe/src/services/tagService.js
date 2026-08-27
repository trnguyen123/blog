import apiFetch from './httpClient';

export const tagService = {
  getAll: () =>
    apiFetch('/tags', { method: 'GET' }),

  getById: (id) =>
    apiFetch(`/tags/${id}`, { method: 'GET' }),

  create: (payload) =>
    apiFetch('/tags', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiFetch(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    apiFetch(`/tags/${id}`, {
      method: 'DELETE',
    }),
};