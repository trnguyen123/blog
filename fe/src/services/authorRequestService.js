import apiFetch from './httpClient';

export const authorRequestService = {
  // User: gửi yêu cầu trở thành author
  create: (payload) =>
    apiFetch('/author-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // User: xem các yêu cầu của chính mình
  getMine: () =>
    apiFetch('/author-requests/me', { method: 'GET' }),

  // Admin: xem tất cả yêu cầu, có thể lọc theo status
  getAll: (status) =>
    apiFetch(`/author-requests${status ? `?status=${status}` : ''}`, {
      method: 'GET',
    }),

  // Admin: duyệt yêu cầu
  approve: (requestId, reviewNote) =>
    apiFetch(`/author-requests/${requestId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),

  // Admin: từ chối yêu cầu
  reject: (requestId, reviewNote) =>
    apiFetch(`/author-requests/${requestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),
};