import apiFetch from './httpClient';

export const notificationService = {
  getMine: (limit = 20, offset = 0) =>
    apiFetch(`/notifications?limit=${limit}&offset=${offset}`, { method: 'GET' }),

  getUnreadCount: () =>
    apiFetch('/notifications/unread-count', { method: 'GET' }),

  markAsRead: (notificationId) =>
    apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' }),

  markAllAsRead: () =>
    apiFetch('/notifications/read-all', { method: 'PATCH' }),

  delete: (notificationId) =>
    apiFetch(`/notifications/${notificationId}`, { method: 'DELETE' }),
};