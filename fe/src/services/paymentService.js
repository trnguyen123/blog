import apiFetch from './httpClient';

export const paymentService = {
  getMyPayments: () =>
    apiFetch('/payments/my', { method: 'GET' }),

  getAllPayments: () =>
    apiFetch('/payments', { method: 'GET' }),

  getById: (id) =>
    apiFetch(`/payments/${id}`, { method: 'GET' }),

  create: (payload) =>
    apiFetch('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markPaid: (id) =>
    apiFetch(`/payments/${id}/mock-paid`, { method: 'POST' }),

  markFailed: (id) =>
    apiFetch(`/payments/${id}/mock-failed`, { method: 'POST' }),
};