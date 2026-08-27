const authorStatsModel = require('../models/author-stats.model');

async function getMyAuthorOverview(authorId) {
  const overview = await authorStatsModel.getAuthorOverview(authorId);

  return {
    total_posts: Number(overview.total_posts || 0),
    published_posts: Number(overview.published_posts || 0),
    draft_posts: Number(overview.draft_posts || 0),
    total_views: Number(overview.total_views || 0),
    total_likes: Number(overview.total_likes || 0),
    total_comments: Number(overview.total_comments || 0)
  };
}

async function getMyTopPosts(authorId, limit = 5) {
  const posts = await authorStatsModel.getAuthorTopPosts(authorId, limit);

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    visibility: post.visibility,
    view_count: Number(post.view_count || 0),
    like_count: Number(post.like_count || 0),
    comment_count: Number(post.comment_count || 0),
    published_at: post.published_at
  }));
}

module.exports = {
  getMyAuthorOverview,
  getMyTopPosts
};