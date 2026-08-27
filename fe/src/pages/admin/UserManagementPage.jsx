import { useEffect, useMemo, useState, useCallback } from 'react';
import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { adminNav } from '../../data/pageData';
import { userAdminService } from '../../services/userAdminService';

const filterTabs = ['All', 'Active', 'Inactive', 'Banned'];
const ASSIGNABLE_ROLES = ['author', 'admin'];

function matchesTab(user, tab) {
  const status = String(user.status || '').toLowerCase();

  if (tab === 'All') return true;
  if (tab === 'Active') return status === 'active';
  if (tab === 'Inactive') return status === 'inactive';
  if (tab === 'Banned') return status === 'banned';

  return true;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active') return 'badge badge-success';
  if (s === 'banned') return 'badge badge-danger';
  return 'badge badge-pending';
}

export default function UserManagementPage({ auth, onLogout, onNavigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('All');
  const [actingId, setActingId] = useState(null);

  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Admin',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const currentUserId = auth?.user;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userAdminService.getAll();
      setUsers(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const visibleUsers = useMemo(
    () => users.filter((user) => matchesTab(user, filterTab)),
    [users, filterTab]
  );

  async function handleChangeStatus(userId, status) {
    try {
      setActingId(userId);
      await userAdminService.updateStatus(userId, status);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setActingId(null);
    }
  }

  async function handleAssignRole(userId, role) {
    try {
      setActingId(userId);
      await userAdminService.assignRole(userId, role);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Gán role thất bại');
    } finally {
      setActingId(null);
    }
  }

  async function handleRemoveRole(userId, role) {
    try {
      setActingId(userId);
      await userAdminService.removeRole(userId, role);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Gỡ role thất bại');
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm('Bạn có chắc muốn xoá user này?')) return;

    try {
      setActingId(userId);
      await userAdminService.delete(userId);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Xoá user thất bại');
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
            <div className="small-text">Admin console</div>
          </div>
        </a>
        <SidebarNav items={adminNav} activeKey="users" onSelect={onNavigate} />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>User Management</h1>
            <p className="text-muted">Review user roles, manage access, and keep your community healthy.</p>
          </div>
          <div className="header-actions">
            {userForMenu && <UserMenu user={userForMenu} onLogout={onLogout} />}
          </div>
        </div>

        <div className="tag-filter-row">
          <div className="tag-filter-left">
            {filterTabs.map((item) => (
              <button
                key={item}
                className={filterTab === item ? 'active' : ''}
                onClick={() => setFilterTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="card text-muted">Không tải được dữ liệu: {error}</div>}

        <div className="card">
          <SectionTitle title="All users" />

          {loading ? (
            <p className="text-muted">Đang tải...</p>
          ) : visibleUsers.length === 0 ? (
            <p className="text-muted">Không có user nào ở mục này.</p>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => {
                    const roles = user.roles || [];
                    const isSelf = Number(user.id) === Number(currentUserId);

                    return (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {roles.length === 0 && <span className="text-muted">—</span>}
                          {roles.map((role) => (
                            <span key={role} className="badge" style={{ marginRight: 4 }}>
                              {role}
                              {!isSelf && (
                                <button
                                  className="badge-remove-btn"
                                  disabled={actingId === user.id}
                                  onClick={() => handleRemoveRole(user.id, role)}
                                  title={`Gỡ role ${role}`}
                                  style={{ marginLeft: 4, cursor: 'pointer' }}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                          {!isSelf && ASSIGNABLE_ROLES.filter((r) => !roles.includes(r)).map((role) => (
                            <button
                              key={role}
                              className="btn btn-secondary btn-sm"
                              disabled={actingId === user.id}
                              onClick={() => handleAssignRole(user.id, role)}
                              style={{ marginLeft: 4 }}
                            >
                              +{role}
                            </button>
                          ))}
                        </td>
                        <td>
                          <span className={statusBadgeClass(user.status)}>{user.status}</span>
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isSelf ? (
                            <span className="text-muted">You</span>
                          ) : (
                            <>
                              {String(user.status).toLowerCase() !== 'banned' ? (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  disabled={actingId === user.id}
                                  onClick={() => handleChangeStatus(user.id, 'banned')}
                                >
                                  Ban
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={actingId === user.id}
                                  onClick={() => handleChangeStatus(user.id, 'active')}
                                >
                                  Unban
                                </button>
                              )}
                              <button
                                className="btn btn-secondary btn-sm"
                                disabled={actingId === user.id}
                                onClick={() => handleDelete(user.id)}
                                style={{ marginLeft: 4 }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}