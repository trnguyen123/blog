const postService = require('../services/post.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function createPost(req, res) {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    return successResponse(res, post, 'Post created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to create post', 500);
  }
}

async function getMyPosts(req, res) {
  try {
    const posts = await postService.getMyPosts(req.user.id);
    return successResponse(res, posts, 'My posts fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch my posts', 500);
  }
}

async function getPublishedPosts(req, res) {
  try {
    const posts = await postService.getPublishedPosts();
    return successResponse(res, posts, 'Published posts fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch posts', 500);
  }
}

async function getPostDetail(req, res) {
  try {
    const post = await postService.getPostDetailBySlug(
      req.params.slug,
      req.user || null
    );

    if (!post) {
      return errorResponse(res, 'Post not found', 404);
    }

    return successResponse(res, post, 'Post fetched successfully');
  } catch (error) {
    if (error.statusCode === 401) {
      return errorResponse(res, error.message, 401);
    }

    if (error.statusCode === 403) {
      return errorResponse(res, error.message, 403);
    }

    return errorResponse(res, error.message || 'Failed to fetch post', 500);
  }
}

async function updateMyPost(req, res) {
  try {
    const post = await postService.updateMyPost(req.user.id, Number(req.params.id), req.body);
    return successResponse(res, post, 'Post updated successfully');
  } catch (error) {
    if (error.message === 'POST_NOT_FOUND') {
      return errorResponse(res, 'Post not found', 404);
    }

    if (error.message === 'FORBIDDEN') {
      return errorResponse(res, 'You cannot update this post', 403);
    }

    return errorResponse(res, error.message || 'Failed to update post', 500);
  }
}

async function deleteMyPost(req, res) {
  try {
    await postService.deleteMyPost(req.user.id, Number(req.params.id));
    return successResponse(res, null, 'Post deleted successfully');
  } catch (error) {
    if (error.message === 'POST_NOT_FOUND') {
      return errorResponse(res, 'Post not found', 404);
    }

    if (error.message === 'FORBIDDEN') {
      return errorResponse(res, 'You cannot delete this post', 403);
    }

    return errorResponse(res, error.message || 'Failed to delete post', 500);
  }
}

async function searchPosts(req, res) {
  try {
    const result = await postService.searchPosts(req.query);
    return successResponse(res, result, 'Posts searched successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to search posts', 500);
  }
}

async function filterPosts(req, res, next) {
  try {
    const result = await postService.filterPosts(req.query);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function recordPostView(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    let ipAddress = req.ip || req.socket?.remoteAddress || null;

    if (ipAddress === '::1') {
      ipAddress = '127.0.0.1';
    }

    if (ipAddress && ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.slice(7);
    }

    const result = await postService.recordPostView(id, userId, ipAddress);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function toggleLike(req, res) {
  try {
    const { id } = req.params;

    const result = await postService.togglePostLike(Number(id), req.user.id);

    return successResponse(
      res,
      result,
      result.isLiked ? 'Post liked successfully' : 'Post unliked successfully'
    );
  } catch (error) {
    if (error.statusCode === 404) {
      return errorResponse(res, error.message, 404);
    }

    return errorResponse(res, error.message || 'Failed to toggle post like', 500);
  }
}

module.exports = {
  createPost,
  getMyPosts,
  getPublishedPosts,
  getPostDetail,
  updateMyPost,
  deleteMyPost,
  searchPosts,
  filterPosts,
  recordPostView,
  toggleLike
};