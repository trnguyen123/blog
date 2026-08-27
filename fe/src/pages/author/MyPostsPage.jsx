import { useEffect, useState, useCallback } from 'react';
import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { authorNav } from '../../data/pageData';
import { statusBadge } from '../../utils/uiHelpers';
import { postManageService } from '../../services/postManageService';

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function MyPostsPage({ auth, onLogout, screen, onNavigate, onEditPost, onCreateNewPost, onShowToast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Author',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await postManageService.getMyPosts();
      setPosts(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleDelete(post) {
    const confirmed = window.confirm(`Xóa bài viết "${post.title}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    try {
      setDeletingId(post.id);
      await postManageService.deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      onShowToast?.('Đã xóa bài viết');
    } catch (err) {
      alert(err.message || 'Xóa thất bại');
    } finally {
      setDeletingId(null);
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
            <h1>My Posts</h1>
            <p className="text-muted">Manage all the posts you've written.</p>
          </div>
          <div className="header-actions">
            {userForMenu && <UserMenu user={userForMenu} onLogout={onLogout} />}
          </div>
        </div>

        {error && <div className="card text-muted">Không tải được dữ liệu: {error}</div>}

        <div className="card">
          <SectionTitle
            title="All posts"
            action={<button className="btn btn-primary btn-sm" onClick={onCreateNewPost}>+ New post</button>}
          />

          {loading ? (
            <p className="text-muted">Đang tải...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted">Bạn chưa có bài viết nào.</p>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Visibility</th>
                    <th>Views</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.title}</td>
                      <td><span className={statusBadge(capitalize(post.status))}>{capitalize(post.status)}</span></td>
                      <td>{capitalize(post.visibility)}</td>
                      <td>{post.view_count}</td>
                      <td>{post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => onEditPost(post)}>Edit</button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post)}
                        >
                          {deletingId === post.id ? 'Đang xóa...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}