const { pool } = require('../config/db');

async function getAdminOverview() {
  const [[usersRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS total_users
    FROM users
    WHERE deleted_at IS NULL
    `
  );

  const [[authorsRow]] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT ur.user_id) AS total_authors
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'author'
    `
  );

  const [[adminsRow]] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT ur.user_id) AS total_admins
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'admin'
    `
  );

  const [[postsRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS total_posts,
      COUNT(CASE WHEN status = 'published' THEN 1 END) AS published_posts,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_posts
    FROM posts
    WHERE deleted_at IS NULL
    `
  );

  const [[commentsRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS total_comments
    FROM comments
    WHERE deleted_at IS NULL
    `
  );

  const [[authorRequestsRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS pending_author_requests
    FROM author_requests
    WHERE status = 'pending'
    `
  );

  const [[subscriptionsRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS active_subscriptions
    FROM subscriptions
    WHERE status = 'active'
    `
  );

  const [[paymentsRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS total_payments,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue
    FROM payments
    `
  );

  return {
    total_users: usersRow.total_users || 0,
    total_authors: authorsRow.total_authors || 0,
    total_admins: adminsRow.total_admins || 0,
    total_posts: postsRow.total_posts || 0,
    published_posts: postsRow.published_posts || 0,
    draft_posts: postsRow.draft_posts || 0,
    total_comments: commentsRow.total_comments || 0,
    pending_author_requests: authorRequestsRow.pending_author_requests || 0,
    active_subscriptions: subscriptionsRow.active_subscriptions || 0,
    total_payments: paymentsRow.total_payments || 0,
    total_revenue: paymentsRow.total_revenue || 0
  };
}

async function getAdminContentStats(limit = 5) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 5;

  const [[summaryRow]] = await pool.execute(
    `
    SELECT
      COALESCE(SUM(view_count), 0) AS total_views,
      COUNT(*) AS total_posts
    FROM posts
    WHERE deleted_at IS NULL
    `
  );

  const [[likesRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS total_likes
    FROM post_likes
    `
  );

  // TODO: bảng `post_shares` chưa tồn tại trong DB, tạm thời bỏ query này.
  // Khi tạo bảng post_shares xong, khôi phục lại đoạn query bên dưới và
  // thay total_shares: 0 bằng total_shares: sharesRow.total_shares || 0
  //
  // const [[sharesRow]] = await pool.execute(
  //   `
  //   SELECT
  //     COUNT(*) AS total_shares
  //   FROM post_shares
  //   `
  // );

  const [[commentsRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS total_comments
    FROM comments
    WHERE deleted_at IS NULL
    `
  );

  const [topPosts] = await pool.execute(
    `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.view_count,
      u.name AS author_name,
      COUNT(DISTINCT pl.id) AS like_count,
      COUNT(DISTINCT c.id) AS comment_count
    FROM posts p
    LEFT JOIN users u ON u.id = p.author_id
    LEFT JOIN post_likes pl ON pl.post_id = p.id
    LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
    GROUP BY p.id, p.title, p.slug, p.view_count, u.name
    ORDER BY p.view_count DESC, like_count DESC, comment_count DESC
    LIMIT ${safeLimit}
    `
  );

  return {
    total_views: summaryRow.total_views || 0,
    total_likes: likesRow.total_likes || 0,
    total_shares: 0, // tạm thời, chưa có bảng post_shares
    avg_views_per_post:
      Number(summaryRow.total_posts || 0) > 0
        ? Number(summaryRow.total_views || 0) / Number(summaryRow.total_posts || 0)
        : 0,
    avg_comments_per_post:
      Number(summaryRow.total_posts || 0) > 0
        ? Number(commentsRow.total_comments || 0) / Number(summaryRow.total_posts || 0)
        : 0,
    top_posts: topPosts
  };
}

async function getAdminPaymentStats() {
  const [[summaryRow]] = await pool.execute(
    `
    SELECT
      COUNT(*) AS total_payments,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_payments,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_payments,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_payments,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue
    FROM payments
    `
  );

  const [revenueByMethod] = await pool.execute(
    `
    SELECT
      payment_method,
      COUNT(*) AS total_transactions,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue
    FROM payments
    GROUP BY payment_method
    ORDER BY total_revenue DESC, total_transactions DESC
    `
  );

  return {
    total_payments: summaryRow.total_payments || 0,
    paid_payments: summaryRow.paid_payments || 0,
    pending_payments: summaryRow.pending_payments || 0,
    failed_payments: summaryRow.failed_payments || 0,
    total_revenue: summaryRow.total_revenue || 0,
    revenue_by_method: revenueByMethod
  };
}

module.exports = {
  getAdminOverview,
  getAdminContentStats,
  getAdminPaymentStats
};