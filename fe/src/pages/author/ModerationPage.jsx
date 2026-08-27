import { useEffect, useMemo, useState, useCallback } from 'react';
import UserMenu from '../../components/UserMenu';
import { authorStatsService } from '../../services/authorStatsService';
import { commentService } from '../../services/commentService';
import { timeAgo } from '../../utils/uiHelpers';
import SidebarNav from '../../components/SidebarNav';
import { authorNav, adminNav } from '../../data/pageData';
import { connectSocket } from '../../services/socketClient';

const aiTabItems = ['All', 'Pending', 'Approved', 'Rejected', 'AI Flagged'];

function matchesTab(comment, tab) {
  if (tab === 'All') return true;
  if (tab === 'Pending') return comment.status === 'pending';
  if (tab === 'Approved') return comment.status === 'approved';
  if (tab === 'Rejected') return comment.status === 'rejected';
  if (tab === 'AI Flagged') return Boolean(comment.ai_flag);
  return true;
}

export default function ModerationPage({ auth, onLogout, onNavigate }) {
  const [filterTab, setFilterTab] = useState('All');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Author',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const isAdmin = auth?.role === 'admin';
  const navItems = isAdmin ? adminNav : authorNav;
  const consoleLabel = isAdmin ? 'Admin console' : 'Author console';
  const backTarget = isAdmin ? 'admin' : 'author';

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authorStatsService.getModerationComments(50);
      setComments(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time: khi có comment mới cần duyệt, tự refetch danh sách (không cần F5)
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handlePending = () => {
      fetchComments();
    };

    socket.on('comment:pending', handlePending);

    return () => {
      socket.off('comment:pending', handlePending);
    };
  }, [fetchComments]);

  const activeComments = useMemo(
    () => comments.filter((comment) => matchesTab(comment, filterTab)),
    [comments, filterTab]
  );

  async function handleModerate(commentId, status) {
    try {
      setActingId(commentId);
      await commentService.updateStatus(commentId, status);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, status } : c))
      );
    } catch (err) {
      alert(err.message || 'Cập nhật thất bại');
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a href="#home" className="sidebar-logo">
          <div className="brand-logo">IW</div>
          <div>
            <strong>Inkwell</strong>
            <div className="small-text">{consoleLabel}</div>
          </div>
        </a>
        <SidebarNav items={navItems} activeKey="moderation" onSelect={onNavigate} />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Comment Moderation</h1>
            <p className="text-muted">Review flagged replies, approve healthy discussion, and keep your community safe.</p>
          </div>
          <div className="header-actions">
            {userForMenu && <UserMenu user={userForMenu} onLogout={onLogout} />}
          </div>
        </div>

        <div className="tag-filter-row">
          <div className="tag-filter-left">
            {aiTabItems.map((item) => (
              <button
                key={item}
                className={filterTab === item ? 'active' : ''}
                onClick={() => setFilterTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary btn-sm back-btn"
            onClick={() => onNavigate?.(backTarget)}
          >
            Back
          </button>
        </div>

        {error && <div className="card text-muted">Không tải được dữ liệu: {error}</div>}

        {loading ? (
          <p className="text-muted">Đang tải...</p>
        ) : activeComments.length === 0 ? (
          <p className="text-muted">Không có bình luận nào ở mục này.</p>
        ) : (
          <div className="comment-moderation-panel">
            {activeComments.map((comment) => (
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
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={actingId === comment.id || comment.status === 'approved'}
                      onClick={() => handleModerate(comment.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={actingId === comment.id || comment.status === 'rejected'}
                      onClick={() => handleModerate(comment.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}