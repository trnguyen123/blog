import apiFetch from './httpClient';

export const commentService = {
  updateStatus: (commentId, status) =>
    apiFetch(`/comments/${commentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};