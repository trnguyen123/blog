import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { adminNav } from '../../data/pageData';
import { authorRequestService } from '../../services/authorRequestService';

const filterTabs = ['All', 'Pending', 'Approved', 'Rejected'];

function getStatusLabel(status) {
  return String(status || '').toLowerCase();
}

function matchesTab(request, tab) {
  const status = getStatusLabel(request.status);

  if (tab === 'All') return true;
  if (tab === 'Pending') return status === 'pending';
  if (tab === 'Approved') return status === 'approved';
  if (tab === 'Rejected') return status === 'rejected';

  return true;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN');
}

export default function AuthorRequestsPage({ auth, onLogout, onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('All');
  const [actingId, setActingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Admin',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authorRequestService.getAll();
      setRequests(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const visibleRequests = useMemo(
    () => requests.filter((request) => matchesTab(request, filterTab)),
    [requests, filterTab]
  );

  async function handleApprove(requestId) {
    const reviewNote = window.prompt('Ghi chú duyệt (không bắt buộc):', '');
    if (reviewNote === null) return; // người dùng bấm Cancel

    try {
      setActingId(requestId);
      await authorRequestService.approve(requestId, reviewNote || null);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Duyệt yêu cầu thất bại');
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(requestId) {
    const reviewNote = window.prompt('Lý do từ chối (không bắt buộc):', '');
    if (reviewNote === null) return; // người dùng bấm Cancel

    try {
      setActingId(requestId);
      await authorRequestService.reject(requestId, reviewNote || null);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Từ chối yêu cầu thất bại');
    } finally {
      setActingId(null);
    }
  }

  function toggleExpand(requestId) {
    setExpandedId((current) => (current === requestId ? null : requestId));
  }

  function statusBadgeClass(status) {
    const s = getStatusLabel(status);
    if (s === 'approved') return 'badge badge-success';
    if (s === 'rejected') return 'badge badge-danger';
    return 'badge badge-pending';
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
        <SidebarNav items={adminNav} activeKey="author-requests" onSelect={onNavigate} />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Author Requests</h1>
            <p className="text-muted">Duyệt hoặc từ chối các yêu cầu trở thành author.</p>
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
          <SectionTitle title="All requests" />

          {loading ? (
            <p className="text-muted">Đang tải...</p>
          ) : visibleRequests.length === 0 ? (
            <p className="text-muted">Không có yêu cầu nào ở mục này.</p>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Reviewed by</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((request) => (
                    <Fragment key={request.id}>
                      <tr>
                        <td>{request.id}</td>
                        <td>
                          <div>{request.user_name || '—'}</div>
                          <div className="small-text text-muted">{request.email}</div>
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          <span
                            className="text-muted"
                            style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                            onClick={() => toggleExpand(request.id)}
                            title="Xem chi tiết"
                          >
                            {request.reason
                              ? request.reason.length > 60
                                ? `${request.reason.slice(0, 60)}...`
                                : request.reason
                              : '—'}
                          </span>
                        </td>
                        <td>
                          <span className={statusBadgeClass(request.status)}>
                            {request.status}
                          </span>
                        </td>
                        <td>{formatDate(request.created_at)}</td>
                        <td>{request.reviewed_by_name || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {getStatusLabel(request.status) === 'pending' ? (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={actingId === request.id}
                                onClick={() => handleApprove(request.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                disabled={actingId === request.id}
                                onClick={() => handleReject(request.id)}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-muted">Reviewed</span>
                          )}
                        </td>
                      </tr>
                      {expandedId === request.id && (
                        <tr>
                          <td colSpan={7}>
                            <div className="card" style={{ margin: 0 }}>
                              <p><strong>Bio:</strong> {request.bio || '—'}</p>
                              <p><strong>Reason:</strong> {request.reason || '—'}</p>
                              <p><strong>Experience:</strong> {request.experience || '—'}</p>
                              <p><strong>Sample work:</strong> {request.sample_work || '—'}</p>
                              {request.review_note && (
                                <p><strong>Review note:</strong> {request.review_note}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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