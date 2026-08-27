import apiFetch from './httpClient';

export const postManageService = {
  getMyPosts: () => apiFetch('/posts/me/list'),
  createPost: (payload) =>
    apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePost: (id, payload) =>
    apiFetch(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePost: (id) =>
    apiFetch(`/posts/${id}`, {
      method: 'DELETE',
    }),
};