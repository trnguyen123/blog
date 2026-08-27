const adminDashboardModel = require('../models/admin-dashboard.model');

async function getDashboardOverview() {
  const data = await adminDashboardModel.getAdminOverview();

  return {
    total_users: Number(data.total_users || 0),
    total_authors: Number(data.total_authors || 0),
    total_admins: Number(data.total_admins || 0),
    total_posts: Number(data.total_posts || 0),
    published_posts: Number(data.published_posts || 0),
    draft_posts: Number(data.draft_posts || 0),
    total_comments: Number(data.total_comments || 0),
    pending_author_requests: Number(data.pending_author_requests || 0),
    active_subscriptions: Number(data.active_subscriptions || 0),
    total_payments: Number(data.total_payments || 0),
    total_revenue: Number(data.total_revenue || 0)
  };
}

async function getDashboardContentStats(limit = 5) {
  const data = await adminDashboardModel.getAdminContentStats(limit);

  return {
    total_views: Number(data.total_views || 0),
    total_likes: Number(data.total_likes || 0),
    total_shares: Number(data.total_shares || 0),
    avg_views_per_post: Number(data.avg_views_per_post || 0),
    avg_comments_per_post: Number(data.avg_comments_per_post || 0),
    top_posts: (data.top_posts || []).map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      author_name: post.author_name,
      view_count: Number(post.view_count || 0),
      like_count: Number(post.like_count || 0),
      comment_count: Number(post.comment_count || 0)
    }))
  };
}

async function getDashboardPaymentStats() {
  const data = await adminDashboardModel.getAdminPaymentStats();

  return {
    total_payments: Number(data.total_payments || 0),
    paid_payments: Number(data.paid_payments || 0),
    pending_payments: Number(data.pending_payments || 0),
    failed_payments: Number(data.failed_payments || 0),
    total_revenue: Number(data.total_revenue || 0),
    revenue_by_method: (data.revenue_by_method || []).map((item) => ({
      payment_method: item.payment_method,
      total_transactions: Number(item.total_transactions || 0),
      total_revenue: Number(item.total_revenue || 0)
    }))
  };
}

module.exports = {
  getDashboardOverview,
  getDashboardContentStats,
  getDashboardPaymentStats
};