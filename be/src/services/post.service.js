const postModel = require('../models/post.model');
const subscriptionService = require('./subscription.service');
const activityLogService = require('./activityLog.service');
const { slugify } = require('../utils/slugify');

async function buildUniqueSlug(title, currentPostId = null) {
  const baseSlug = slugify(title);
  let slug = baseSlug || `post-${Date.now()}`;
  let counter = 1;

  while (true) {
    const existingPost = await postModel.findPostBySlug(slug);

    if (
      !existingPost ||
      Number(existingPost.id) === Number(currentPostId)
    ) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

async function createPost(authorId, payload) {
  const status = payload.status || 'draft';
  const visibility = payload.visibility || 'public';

  const slug = payload.slug
    ? slugify(payload.slug)
    : await buildUniqueSlug(payload.title);

  const publishedAt =
    status === 'published'
      ? payload.published_at || new Date()
      : null;

  const postId = await postModel.createPost({
    title: payload.title.trim(),
    slug,
    content: payload.content,
    excerpt: payload.excerpt || null,
    thumbnail_url: payload.thumbnail_url || null,
    author_id: authorId,
    status,
    visibility,
    published_at: publishedAt
  });

  if (
    Array.isArray(payload.categoryIds) &&
    payload.categoryIds.length > 0
  ) {
    await postModel.setPostCategories(
      postId,
      payload.categoryIds
    );
  }

  if (
    Array.isArray(payload.tagIds) &&
    payload.tagIds.length > 0
  ) {
    await postModel.setPostTags(postId, payload.tagIds);
  }

  await activityLogService.tryLogActivity({
    userId: authorId,
    action: 'CREATE_POST',
    targetType: 'post',
    targetId: postId
  });

  if (status === 'published') {
    await activityLogService.tryLogActivity({
      userId: authorId,
      action: 'PUBLISH_POST',
      targetType: 'post',
      targetId: postId
    });
  }

  return postModel.findPostById(postId);
}

async function getMyPosts(authorId) {
  return postModel.getPostsByAuthor(authorId);
}

async function getPublishedPosts() {
  return postModel.getPublishedPosts();
}

async function getPostDetailBySlug(
  slug,
  currentUser = null
) {
  const post = await postModel.findPostBySlug(slug);

  if (!post || post.status !== 'published') {
    return null;
  }

  if (post.visibility === 'premium') {
    if (!currentUser || !currentUser.id) {
      const error = new Error(
        'Login required to access premium post'
      );

      error.statusCode = 401;
      throw error;
    }

    const hasAccess =
      await subscriptionService.hasActiveSubscription(
        currentUser.id
      );

    if (!hasAccess) {
      const error = new Error(
        'You need an active subscription to access this premium post'
      );

      error.statusCode = 403;
      throw error;
    }
  }

  const [
    categories,
    tags,
    likeCount
  ] = await Promise.all([
    postModel.getCategoriesByPostId(post.id),
    postModel.getTagsByPostId(post.id),
    postModel.countLikesByPostId(post.id)
  ]);

  let isLiked = false;

  if (currentUser && currentUser.id) {
    const existingLike =
      await postModel.findPostLike(
        post.id,
        currentUser.id
      );

    isLiked = !!existingLike;
  }

  return {
    ...post,
    categories,
    tags,
    like_count: likeCount,
    is_liked: isLiked
  };
}

async function updateMyPost(
  authorId,
  postId,
  payload
) {
  const existingPost =
    await postModel.findPostById(postId);

  if (!existingPost) {
    throw new Error('POST_NOT_FOUND');
  }

  if (
    Number(existingPost.author_id) !== Number(authorId)
  ) {
    throw new Error('FORBIDDEN');
  }

  let slug = existingPost.slug;

  if (payload.slug) {
    slug = await buildUniqueSlug(
      payload.slug,
      existingPost.id
    );
  } else if (
    payload.title &&
    payload.title !== existingPost.title
  ) {
    slug = await buildUniqueSlug(
      payload.title,
      existingPost.id
    );
  }

  const nextStatus =
    payload.status || existingPost.status;

  const publishedAt =
    nextStatus === 'published'
      ? payload.published_at ||
        existingPost.published_at ||
        new Date()
      : null;

  await postModel.updatePost(existingPost.id, {
    title: payload.title ?? existingPost.title,
    slug,
    content: payload.content ?? existingPost.content,
    excerpt: payload.excerpt ?? existingPost.excerpt,
    thumbnail_url:
      payload.thumbnail_url ??
      existingPost.thumbnail_url,
    status: nextStatus,
    visibility:
      payload.visibility ?? existingPost.visibility,
    published_at: publishedAt
  });

  if (Array.isArray(payload.categoryIds)) {
    await postModel.setPostCategories(
      existingPost.id,
      payload.categoryIds
    );
  }

  if (Array.isArray(payload.tagIds)) {
    await postModel.setPostTags(
      existingPost.id,
      payload.tagIds
    );
  }

  await activityLogService.tryLogActivity({
    userId: authorId,
    action: 'UPDATE_POST',
    targetType: 'post',
    targetId: existingPost.id
  });

  if (
    existingPost.status !== 'published' &&
    nextStatus === 'published'
  ) {
    await activityLogService.tryLogActivity({
      userId: authorId,
      action: 'PUBLISH_POST',
      targetType: 'post',
      targetId: existingPost.id
    });
  }

  if (
    existingPost.status === 'published' &&
    nextStatus !== 'published'
  ) {
    await activityLogService.tryLogActivity({
      userId: authorId,
      action: 'UNPUBLISH_POST',
      targetType: 'post',
      targetId: existingPost.id
    });
  }

  return postModel.findPostById(existingPost.id);
}

async function deleteMyPost(authorId, postId) {
  const existingPost =
    await postModel.findPostById(postId);

  if (!existingPost) {
    throw new Error('POST_NOT_FOUND');
  }

  if (
    Number(existingPost.author_id) !== Number(authorId)
  ) {
    throw new Error('FORBIDDEN');
  }

  const deleted =
    await postModel.softDeletePost(postId);

  if (!deleted) {
    const error = new Error('Delete post failed');
    error.statusCode = 400;
    throw error;
  }

  await activityLogService.tryLogActivity({
    userId: authorId,
    action: 'DELETE_POST',
    targetType: 'post',
    targetId: postId
  });

  return true;
}

async function searchPosts(query) {
  const keyword = query.q
    ? String(query.q).trim()
    : null;

  const categoryId = query.categoryId
    ? Number(query.categoryId)
    : null;

  const tagId = query.tagId
    ? Number(query.tagId)
    : null;

  const page =
    Number(query.page) > 0
      ? Number(query.page)
      : 1;

  const limit =
    Number(query.limit) > 0
      ? Math.min(Number(query.limit), 50)
      : 10;

  const offset = (page - 1) * limit;

  const [
    posts,
    total
  ] = await Promise.all([
    postModel.searchPublishedPosts({
      keyword,
      categoryId,
      tagId,
      limit,
      offset
    }),
    postModel.countSearchPublishedPosts({
      keyword,
      categoryId,
      tagId
    })
  ]);

  const postsWithRelations =
    await Promise.all(
      posts.map(async (post) => {
        const [
          categories,
          tags
        ] = await Promise.all([
          postModel.getCategoriesByPostId(post.id),
          postModel.getTagsByPostId(post.id)
        ]);

        return {
          ...post,
          categories,
          tags
        };
      })
    );

  return {
    items: postsWithRelations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    filters: {
      q: keyword,
      categoryId,
      tagId
    }
  };
}

async function filterPosts(query) {
  return postModel.filterPosts({
    q: query.q || null,
    categoryId: query.categoryId || null,
    tagId: query.tagId || null,
    status: query.status || null,
    visibility: query.visibility || null,
    authorId: query.authorId || null
  });
}

async function recordPostView(
  postId,
  userId = null,
  ipAddress = null
) {
  const post =
    await postModel.findPostById(postId);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  const viewBucket =
    postModel.getFiveMinuteBucket();

  let existingView = null;

  if (userId) {
    existingView =
      await postModel.findPostViewByUser(
        postId,
        userId,
        viewBucket
      );
  } else if (ipAddress) {
    existingView =
      await postModel.findPostViewByIp(
        postId,
        ipAddress,
        viewBucket
      );
  }

  if (existingView) {
    return {
      counted: false,
      message:
        'View already counted in this 5-minute window'
    };
  }

  await postModel.createPostView({
    postId,
    userId,
    ipAddress,
    viewBucket
  });

  await postModel.incrementPostViewCount(postId);

  return {
    counted: true,
    message: 'View counted successfully'
  };
}

async function togglePostLike(postId, userId) {
  const post =
    await postModel.findPostById(postId);

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  const existingLike =
    await postModel.findPostLike(
      postId,
      userId
    );

  if (existingLike) {
    await postModel.deletePostLike(
      postId,
      userId
    );
  } else {
    await postModel.createPostLike(
      postId,
      userId
    );
  }

  const likeCount =
    await postModel.countLikesByPostId(postId);

  return {
    postId,
    isLiked: !existingLike,
    likeCount
  };
}

module.exports = {
  createPost,
  getMyPosts,
  getPublishedPosts,
  getPostDetailBySlug,
  updateMyPost,
  deleteMyPost,
  searchPosts,
  filterPosts,
  recordPostView,
  togglePostLike
};