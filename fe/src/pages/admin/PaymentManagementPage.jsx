import { useEffect, useMemo, useState, useCallback } from 'react';
import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';
import { authorNav, adminNav } from '../../data/pageData';
import { paymentService } from '../../services/paymentService';


const filterTabs = ['All', 'Pending', 'Paid', 'Failed', 'Cancelled'];


function getStatusLabel(status) {
  return String(status || '').toLowerCase();
}


function matchesTab(payment, tab) {
  const status = getStatusLabel(payment.status);

  if (tab === 'All') return true;
  if (tab === 'Pending') return status === 'pending';
  if (tab === 'Paid') return status === 'paid';
  if (tab === 'Failed') return status === 'failed';
  if (tab === 'Cancelled') return status === 'cancelled';

  return true;
}


export default function PaymentManagementPage({ auth, onLogout, onNavigate }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('All');
  const [actingId, setActingId] = useState(null);

  const userForMenu = auth?.user ? {
    name: auth.displayName || auth.email || 'Author',
    email: auth.email || '',
    avatarUrl: null,
  } : null;

  const isAdmin = auth?.role === 'admin';
  const navItems = isAdmin ? adminNav : authorNav;
  const consoleLabel = isAdmin ? 'Admin console' : 'Author console';

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);

      const data = isAdmin
        ? await paymentService.getAllPayments()
        : await paymentService.getMyPayments();

      setPayments(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách payment');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const visiblePayments = useMemo(
    () => payments.filter((payment) => matchesTab(payment, filterTab)),
    [payments, filterTab]
  );

  async function handleMarkPaid(paymentId) {
    try {
      setActingId(paymentId);
      await paymentService.markPaid(paymentId);
      await fetchPayments();
    } catch (err) {
      alert(err.message || 'Cập nhật payment thất bại');
    } finally {
      setActingId(null);
    }
  }

  async function handleMarkFailed(paymentId) {
    try {
      setActingId(paymentId);
      await paymentService.markFailed(paymentId);
      await fetchPayments();
    } catch (err) {
      alert(err.message || 'Cập nhật payment thất bại');
    } finally {
      setActingId(null);
    }
  }

  function formatAmount(amount) {
    if (amount === null || amount === undefined || amount === '') return '—';
    return Number(amount).toLocaleString('vi-VN');
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
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
        <SidebarNav items={navItems} activeKey="payment" onSelect={onNavigate} />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Payments</h1>
            <p className="text-muted">
              {isAdmin
                ? 'Quản lý thanh toán của toàn bộ authors.'
                : 'Theo dõi các payment của bạn.'}
            </p>
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
          <SectionTitle title="All payments" />

          {loading ? (
            <p className="text-muted">Đang tải...</p>
          ) : visiblePayments.length === 0 ? (
            <p className="text-muted">Không có payment nào ở mục này.</p>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {isAdmin && <th>User</th>}
                    <th>Subscription</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Transaction</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      {isAdmin && (
                        <td>
                          {payment.user_id}
                        </td>
                      )}
                      <td>{payment.subscription_id}</td>
                      <td>{payment.payment_method}</td>
                      <td>{formatAmount(payment.amount)}</td>
                      <td>{payment.status}</td>
                      <td>{payment.transaction_id || '—'}</td>
                      <td>{formatDate(payment.created_at)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isAdmin ? (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={actingId === payment.id || payment.status !== 'pending'}
                              onClick={() => handleMarkPaid(payment.id)}
                            >
                              Paid
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={actingId === payment.id || payment.status !== 'pending'}
                              onClick={() => handleMarkFailed(payment.id)}
                            >
                              Failed
                            </button>
                          </>
                        ) : (
                          <span className="text-muted">View only</span>
                        )}
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