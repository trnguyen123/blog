import apiFetch from './httpClient';

export const subscriptionPlanService = {
  getAll: () => apiFetch('/subscription-plans', { method: 'GET' }),
  create: (payload) =>
    apiFetch('/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiFetch(`/subscription-plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    apiFetch(`/subscription-plans/${id}`, {
      method: 'DELETE',
    }),
};