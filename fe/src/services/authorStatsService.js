import apiFetch from './httpClient';

export const authorStatsService = {
  getOverview: () => apiFetch('/authors/me/stats/overview'),
  getTopPosts: (limit = 4) => apiFetch(`/authors/me/stats/top-posts?limit=${limit}`),
  getPendingComments: (limit = 5) => apiFetch(`/comments/pending/me?limit=${limit}`),
  getModerationComments: (limit = 50) => apiFetch(`/comments/moderation/me?limit=${limit}`),
};