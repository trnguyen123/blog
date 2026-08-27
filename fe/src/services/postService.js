const API_BASE_URL = 'http://localhost:8000/api';

async function handleResponse(response) {
  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Request failed');
  }

  return result.data;
}

export const postService = {
  getPublishedPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/posts/published`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  },

  getPostDetailBySlug: async (slug) => {
    const response = await fetch(`${API_BASE_URL}/posts/slug/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  },

  getPostComments: async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  },

  createComment: async (payload) => {
    const { post_id, ...rest } = payload;

    let token = null;
    try {
      const authRaw = localStorage.getItem('inkwell-auth');
      const authData = authRaw ? JSON.parse(authRaw) : null;
      token = authData?.token || null;
    } catch (e) {
      token = null;
    }

    const response = await fetch(`${API_BASE_URL}/posts/${post_id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(rest),
    });

    return handleResponse(response);
  },

  getCommentReplies: async (commentId) => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  },

  toggleLike: async (postId) => {
    let token = null;
    try {
      const authRaw = localStorage.getItem('inkwell-auth');
      const authData = authRaw ? JSON.parse(authRaw) : null;
      token = authData?.token || null;
    } catch (e) {
      token = null;
    }

    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return handleResponse(response);
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  },

  getTags: async () => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  },
};