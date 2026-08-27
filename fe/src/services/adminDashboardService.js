import apiFetch from './httpClient';

export const adminDashboardService = {
  getOverview: () => apiFetch('/admin/dashboard/overview'),
  getContentStats: (limit = 4) => apiFetch(`/admin/dashboard/content-stats?limit=${limit}`),
  getPaymentStats: () => apiFetch('/admin/dashboard/payment-stats'),
};