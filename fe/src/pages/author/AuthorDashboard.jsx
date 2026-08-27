import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { authorNav } from '../../data/pageData';
import { statusBadge, timeAgo } from '../../utils/uiHelpers';
import { useAuthorDashboard } from '../../hooks/useAuthorDashboard';
import { commentService } from '../../services/commentService';

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function AuthorDashboard({ auth, onLogout, screen, onNavigate, onEditPost }) {
  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Author',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const { overview, topPosts, pendingComments, loading, error, refetch } = useAuthorDashboard();

  const statCards = overview ? [
    { label: 'Total Posts', value: overview.total_posts },
    { label: 'Total Views', value: overview.total_views },
    { label: 'Total Likes', value: overview.total_likes },
    { label: 'Total Comments', value: overview.total_comments },
  ] : [];

  async function handleModerate(commentId, status) {
    try {
      await commentService.updateStatus(commentId, status);
      refetch();
    } catch (err) {
      alert(err.message || 'Cập nhật thất bại');
    }
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a href="#home" className="sidebar-logo">
          <div className="brand-logo">IW</div>
          <div>
            <strong>Inkwell</strong>
            <div className="small-text">Author console</div>
          </div>
        </a>
        <SidebarNav items={authorNav} activeKey={screen} onSelect={onNavigate} />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted">A snapshot of your author performance and pending activity.</p>
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
                  <strong>{stat.value.toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div className="card">
              <SectionTitle
                title="Recent posts"
                action={<button className="btn btn-secondary btn-sm" onClick={() => onNavigate('myposts')}>View all</button>}
              />
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Views</th>
                      <th>Comments</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((post) => (
                      <tr key={post.id}>
                        <td>{post.title}</td>
                        <td><span className={statusBadge(capitalize(post.status))}>{capitalize(post.status)}</span></td>
                        <td>{post.view_count}</td>
                        <td>{post.comment_count}</td>
                        <td>{post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => onEditPost(post)}>Edit</button>
                          <button className="btn btn-secondary btn-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card comment-moderation-panel">
              <SectionTitle title="Comments pending moderation" subtitle="AI scores help you prioritize reviews." />
              {pendingComments.length === 0 && (
                <p className="text-muted">Không có bình luận nào đang chờ duyệt.</p>
              )}
              {pendingComments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <img
                    className="avatar-md"
                    src={comment.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'}
                    alt={comment.username}
                  />
                  <div>
                    <div className="comment-header">
                      <div>
                        <strong>{comment.username}</strong>
                        <div className="small-text">{comment.post_title} • {timeAgo(comment.created_at)}</div>
                      </div>
                      <span className="badge warning">AI {Math.round((comment.ai_score || 0) * 100)}%</span>
                    </div>
                    <p>{comment.content}</p>
                    <div className="comment-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleModerate(comment.id, 'approved')}>Approve</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleModerate(comment.id, 'rejected')}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}