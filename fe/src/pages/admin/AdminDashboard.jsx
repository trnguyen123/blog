import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { adminNav } from '../../data/pageData';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

// Tỷ giá quy đổi VNĐ -> USD. Chỉnh lại số này cho khớp tỷ giá bạn muốn dùng,
// hoặc thay bằng tỷ giá lấy động từ API nếu cần chính xác theo thời gian thực.
const VND_TO_USD_RATE = 25000;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatRevenueVndAsUsd(amountInVnd) {
  const usdAmount = Number(amountInVnd || 0) / VND_TO_USD_RATE;
  return currencyFormatter.format(usdAmount);
}

export default function AdminDashboard({ auth, onLogout, onNavigate }) {
  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Admin',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const { overview, topPosts, loading, error } = useAdminDashboard();

  const statCards = overview ? [
    { label: 'Total Users', value: overview.total_users.toLocaleString() },
    { label: 'Total Authors', value: overview.total_authors.toLocaleString() },
    { label: 'Total Posts', value: overview.total_posts.toLocaleString() },
    { label: 'Active Subscriptions', value: overview.active_subscriptions.toLocaleString() },
    { label: 'Pending Author Requests', value: overview.pending_author_requests.toLocaleString() },
    { label: 'Total Revenue', value: formatRevenueVndAsUsd(overview.total_revenue) },
  ] : [];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a href="#home" className="sidebar-logo">
          <div className="brand-logo">IW</div>
          <div>
            <strong>Inkwell</strong>
            <div className="small-text">Admin control center</div>
          </div>
        </a>
        <SidebarNav items={adminNav} activeKey="admin" onSelect={onNavigate} />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Super Admin Dashboard</h1>
            <p className="text-muted">Monitor core platform health, user growth, and AI performance in one place.</p>
          </div>
          <div className="header-actions">
            {userForMenu && <UserMenu user={userForMenu} onLogout={onLogout} />}
          </div>
        </div>

        {error && <div className="card text-muted">Không tải được dữ liệu: {error}</div>}

        {loading ? (
          <div className="card text-muted">Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="stats-row">
              {statCards.map((stat) => (
                <div key={stat.label} className="stat-card card">
                  <small>{stat.label}</small>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="card">
              <SectionTitle title="Latest published posts" action={<button className="btn btn-secondary btn-sm">Export CSV</button>} />
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Views</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((post) => (
                      <tr key={post.id}>
                        <td>{post.title}</td>
                        <td>{post.author_name || '—'}</td>
                        <td>{post.view_count}</td>
                        <td>{post.comment_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}