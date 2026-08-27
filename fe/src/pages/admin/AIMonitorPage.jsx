import {
  useEffect,
  useMemo,
  useState,
  useCallback
} from 'react';

import SidebarNav from '../../components/SidebarNav';
import UserMenu from '../../components/UserMenu';
import SectionTitle from '../../components/SectionTitle';

import { adminNav } from '../../data/pageData';
import activityLogService from '../../services/activityLogService';

const ACTION_GROUPS = {
  ALL: 'All actions',
  USER: 'User & auth',
  AUTHOR: 'Author requests',
  POST: 'Posts',
  COMMENT: 'Comments',
  PAYMENT: 'Payments',
  TAXONOMY: 'Tags & categories',
  AI: 'AI moderation'
};

const ACTION_LABELS = {
  USER_REGISTER: 'User registered',
  USER_LOGIN: 'User login',
  USER_LOGOUT: 'User logout',

  CREATE_AUTHOR_REQUEST: 'Create author request',
  APPROVE_AUTHOR_REQUEST: 'Approve author request',
  REJECT_AUTHOR_REQUEST: 'Reject author request',

  UPDATE_USER_STATUS: 'Update user status',
  DELETE_USER: 'Delete user',
  ASSIGN_ROLE: 'Assign role',
  REMOVE_ROLE: 'Remove role',

  CREATE_POST: 'Create post',
  UPDATE_POST: 'Update post',
  DELETE_POST: 'Delete post',
  PUBLISH_POST: 'Publish post',
  UNPUBLISH_POST: 'Unpublish post',

  CREATE_COMMENT: 'Create comment',
  AI_FLAG_COMMENT: 'AI flagged comment',
  APPROVE_COMMENT: 'Approve comment',
  REJECT_COMMENT: 'Reject comment',
  UPDATE_COMMENT: 'Update comment',
  DELETE_COMMENT: 'Delete comment',
  REPORT_COMMENT: 'Report comment',

  CREATE_PAYMENT: 'Create payment',
  PAYMENT_PAID: 'Payment paid',
  PAYMENT_FAILED: 'Payment failed',
  PAYMENT_CANCELLED: 'Payment cancelled',

  CREATE_TAG: 'Create tag',
  UPDATE_TAG: 'Update tag',
  DELETE_TAG: 'Delete tag',

  CREATE_CATEGORY: 'Create category',
  UPDATE_CATEGORY: 'Update category',
  DELETE_CATEGORY: 'Delete category'
};

function getActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

function getActionGroup(action) {
  if (action === 'AI_FLAG_COMMENT') {
    return ACTION_GROUPS.AI;
  }

  if (
    action?.startsWith('USER_') ||
    action === 'UPDATE_USER_STATUS' ||
    action === 'DELETE_USER' ||
    action === 'ASSIGN_ROLE' ||
    action === 'REMOVE_ROLE'
  ) {
    return ACTION_GROUPS.USER;
  }

  if (action?.includes('AUTHOR_REQUEST')) {
    return ACTION_GROUPS.AUTHOR;
  }

  if (action?.includes('POST')) {
    return ACTION_GROUPS.POST;
  }

  if (
    action?.includes('COMMENT') ||
    action === 'REPORT_COMMENT'
  ) {
    return ACTION_GROUPS.COMMENT;
  }

  if (
    action?.includes('PAYMENT') ||
    action === 'CREATE_PAYMENT'
  ) {
    return ACTION_GROUPS.PAYMENT;
  }

  if (
    action?.includes('TAG') ||
    action?.includes('CATEGORY')
  ) {
    return ACTION_GROUPS.TAXONOMY;
  }

  return ACTION_GROUPS.ALL;
}

function getActionClass(action) {
  if (
    action?.includes('DELETE') ||
    action?.includes('REJECT') ||
    action?.includes('FAILED') ||
    action?.includes('CANCELLED')
  ) {
    return 'activity-badge activity-badge-danger';
  }

  if (
    action?.includes('APPROVE') ||
    action?.includes('PUBLISH') ||
    action === 'PAYMENT_PAID'
  ) {
    return 'activity-badge activity-badge-success';
  }

  if (
    action?.includes('AI_FLAG') ||
    action?.includes('REPORT')
  ) {
    return 'activity-badge activity-badge-warning';
  }

  if (
    action?.includes('CREATE') ||
    action?.includes('REGISTER') ||
    action?.includes('LOGIN')
  ) {
    return 'activity-badge activity-badge-info';
  }

  return 'activity-badge activity-badge-neutral';
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('vi-VN');
}

function isToday(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function escapeCsvValue(value) {
  return `"${String(value ?? '').replace(
    /"/g,
    '""'
  )}"`;
}

function exportLogsToCsv(logs) {
  const headers = [
    'ID',
    'User ID',
    'Action',
    'Target Type',
    'Target ID',
    'Created At'
  ];

  const rows = logs.map((item) => [
    item.id,
    item.user_id,
    item.action,
    item.target_type,
    item.target_id,
    item.created_at
  ]);

  const csvContent = [
    headers,
    ...rows
  ]
    .map((row) =>
      row.map(escapeCsvValue).join(',')
    )
    .join('\n');

  const blob = new Blob(
    [`\ufeff${csvContent}`],
    {
      type: 'text/csv;charset=utf-8;'
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `activity-logs-${Date.now()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function AIMonitorPage({
  auth,
  onLogout,
  onNavigate
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionGroup, setActionGroup] =
    useState(ACTION_GROUPS.ALL);
  const [actionFilter, setActionFilter] =
    useState('ALL');

  const userForMenu = auth?.user
    ? {
        name:
          auth.displayName ||
          auth.email ||
          'Admin',
        email: auth.email || '',
        avatarUrl: null
      }
    : null;

  const isAdmin = auth?.role === 'admin';

  const fetchActivityLogs = useCallback(
    async (showRefreshLoading = false) => {
      try {
        if (showRefreshLoading) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const data =
          await activityLogService.getAllActivityLogs();

        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.message ||
            'Không tải được activity logs'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const actionOptions = useMemo(() => {
    const actions = logs
      .map((item) => item.action)
      .filter(Boolean);

    return [...new Set(actions)].sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return logs.filter((item) => {
      const matchesGroup =
        actionGroup === ACTION_GROUPS.ALL ||
        getActionGroup(item.action) === actionGroup;

      const matchesAction =
        actionFilter === 'ALL' ||
        item.action === actionFilter;

      const searchableText = [
        item.id,
        item.user_id,
        item.action,
        item.target_type,
        item.target_id
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return (
        matchesGroup &&
        matchesAction &&
        matchesSearch
      );
    });
  }, [
    logs,
    search,
    actionGroup,
    actionFilter
  ]);

  const metrics = useMemo(() => {
    const activeUsers = new Set(
      logs
        .map((item) => item.user_id)
        .filter(
          (userId) => userId !== null
        )
    );

    const logsToday = logs.filter((item) =>
      isToday(item.created_at)
    );

    const aiLogs = logs.filter(
      (item) => item.action === 'AI_FLAG_COMMENT'
    );

    return {
      total: logs.length,
      today: logsToday.length,
      activeUsers: activeUsers.size,
      aiAlerts: aiLogs.length
    };
  }, [logs]);

  function handleClearFilters() {
    setSearch('');
    setActionGroup(ACTION_GROUPS.ALL);
    setActionFilter('ALL');
  }

  function handleReviewAlerts() {
    setSearch('');
    setActionGroup(ACTION_GROUPS.AI);
    setActionFilter('AI_FLAG_COMMENT');
  }

  const navItems = isAdmin ? adminNav : [];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a
          href="#home"
          className="sidebar-logo"
        >
          <div className="brand-logo">
            IW
          </div>

          <div>
            <strong>Inkwell</strong>

            <div className="small-text">
              Admin console
            </div>
          </div>
        </a>

        <SidebarNav
          items={navItems}
          activeKey="logs"
          onSelect={onNavigate}
        />
      </aside>

      <main className="dashboard-main">
        <div className="top-header">
          <div>
            <h1>Activity Logs</h1>

            <p className="text-muted">
              Theo dõi các hoạt động của user,
              admin, moderation và payment.
            </p>
          </div>

          <div className="header-actions">
            {userForMenu && (
              <UserMenu
                user={userForMenu}
                onLogout={onLogout}
              />
            )}
          </div>
        </div>

        <div className="activity-header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleReviewAlerts}
          >
            Review AI alerts
          </button>

          <button
            className="btn btn-secondary"
            onClick={() =>
              fetchActivityLogs(true)
            }
            disabled={refreshing}
          >
            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>

        <div className="activity-metrics-grid">
          <div className="metric-tile">
            <span className="metric-label">
              Total logs
            </span>

            <strong>{metrics.total}</strong>
          </div>

          <div className="metric-tile">
            <span className="metric-label">
              Logs today
            </span>

            <strong>{metrics.today}</strong>
          </div>

          <div className="metric-tile">
            <span className="metric-label">
              Active users
            </span>

            <strong>
              {metrics.activeUsers}
            </strong>
          </div>

          <div className="metric-tile">
            <span className="metric-label">
              AI alerts
            </span>

            <strong>
              {metrics.aiAlerts}
            </strong>
          </div>
        </div>

        {error && (
          <div className="card text-muted">
            Không tải được dữ liệu: {error}
          </div>
        )}

        <div className="card">
          <SectionTitle title="Activity history" />

          <div className="activity-log-toolbar">
            <div className="activity-filter-grid">
              <div className="filter-field">
                <label htmlFor="activity-search">
                  Search
                </label>

                <input
                  id="activity-search"
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search action, user ID, target..."
                />
              </div>

              <div className="filter-field">
                <label htmlFor="activity-group">
                  Group
                </label>

                <select
                  id="activity-group"
                  value={actionGroup}
                  onChange={(event) => {
                    setActionGroup(
                      event.target.value
                    );
                    setActionFilter('ALL');
                  }}
                >
                  {Object.values(
                    ACTION_GROUPS
                  ).map((group) => (
                    <option
                      key={group}
                      value={group}
                    >
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="activity-action">
                  Action
                </label>

                <select
                  id="activity-action"
                  value={actionFilter}
                  onChange={(event) =>
                    setActionFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="ALL">
                    All actions
                  </option>

                  {actionOptions.map((action) => (
                    <option
                      key={action}
                      value={action}
                    >
                      {getActionLabel(action)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-button-field">
                <button
                  className="btn btn-secondary"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </button>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() =>
                exportLogsToCsv(filteredLogs)
              }
              disabled={
                filteredLogs.length === 0
              }
            >
              Export CSV
            </button>
          </div>

          <p className="text-muted activity-result-count">
            Showing {filteredLogs.length} of{' '}
            {logs.length} logs
          </p>

          {loading ? (
            <p className="text-muted">
              Đang tải activity logs...
            </p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-muted">
              Không tìm thấy activity log nào.
            </p>
          ) : (
            <div className="table-shell">
              <table className="data-table activity-log-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Created at</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((item) => (
                    <tr key={item.id}>
                      <td>
                        #{item.id}
                      </td>

                      <td>
                        <span
                          className={getActionClass(
                            item.action
                          )}
                        >
                          {getActionLabel(
                            item.action
                          )}
                        </span>

                        <div className="activity-action-code">
                          {item.action}
                        </div>
                      </td>

                      <td>
                        {item.user_id ? (
                          `User #${item.user_id}`
                        ) : (
                          <span className="text-muted">
                            System / AI
                          </span>
                        )}
                      </td>

                      <td>
                        <strong>
                          {item.target_type || '—'}
                        </strong>

                        <div className="small-text">
                          ID: {item.target_id || '—'}
                        </div>
                      </td>

                      <td>
                        {formatDate(
                          item.created_at
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