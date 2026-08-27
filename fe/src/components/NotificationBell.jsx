import {
  useEffect,
  useRef,
  useState
} from 'react';

import './NotificationBell.css';
import { notificationService } from '../services/notificationService';

function formatNotificationTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('vi-VN');
}

function getNotificationMessage(notification) {
  return (
    notification.message ||
    notification.title ||
    'Bạn có một thông báo mới'
  );
}

function isNotificationUnread(notification) {
  if (notification.is_read !== undefined) {
    return !notification.is_read;
  }

  if (notification.read !== undefined) {
    return !notification.read;
  }

  if (notification.status !== undefined) {
    return notification.status !== 'read';
  }

  return false;
}

export default function NotificationBell({
  auth,
  onNotificationReceived
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState([]);
  const [unreadCount, setUnreadCount] =
    useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ref = useRef(null);

  const isLoggedIn = Boolean(auth?.user);

  async function loadUnreadCount() {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    try {
      const result =
        await notificationService.getUnreadCount();

      const count =
        typeof result === 'number'
          ? result
          : result?.count ||
            result?.unreadCount ||
            0;

      setUnreadCount(Number(count));
    } catch (requestError) {
      console.error(
        'Load unread notification count failed:',
        requestError.message
      );
    }
  }

  async function loadNotifications() {
    if (!isLoggedIn) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result =
        await notificationService.getMine(
          20,
          0
        );

      const notificationList =
        Array.isArray(result)
          ? result
          : result?.items ||
            result?.notifications ||
            [];

      setNotifications(notificationList);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Không tải được notifications'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnreadCount();
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  async function handleToggle() {
    const nextOpen = !isOpen;

    setIsOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  }

  async function handleNotificationClick(
    notification
  ) {
    const notificationId =
      notification.id ||
      notification.notification_id;

    const unread =
      isNotificationUnread(notification);

    if (unread && notificationId) {
      try {
        await notificationService.markAsRead(
          notificationId
        );

        setNotifications((current) =>
          current.map((item) => {
            const itemId =
              item.id ||
              item.notification_id;

            if (
              Number(itemId) !==
              Number(notificationId)
            ) {
              return item;
            }

            return {
              ...item,
              is_read: true,
              read: true,
              status: 'read'
            };
          })
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      } catch (requestError) {
        console.error(
          'Mark notification as read failed:',
          requestError.message
        );
      }
    }

    if (
      onNotificationReceived &&
      notification.entity_type &&
      notification.entity_id
    ) {
      onNotificationReceived(notification);
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    try {
      await notificationService.markAllAsRead();

      setUnreadCount(0);

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read: true,
          status: 'read'
        }))
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Không thể đánh dấu tất cả đã đọc'
      );
    }
  }

  function handleNewNotification(notification) {
    setNotifications((current) => [
      notification,
      ...current
    ]);

    setUnreadCount((current) => current + 1);

    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  }

  // Cho App hoặc socket client có thể gọi qua event window
  useEffect(() => {
    function handleSocketNotification(event) {
      handleNewNotification(event.detail);
    }

    window.addEventListener(
      'notification:new',
      handleSocketNotification
    );

    return () => {
      window.removeEventListener(
        'notification:new',
        handleSocketNotification
      );
    };
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div
      className="notif-bell"
      ref={ref}
    >
      <button
        type="button"
        className={`notif-button ${
          isOpen ? 'open' : ''
        }`}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M9 1.5A5.5 5.5 0 003.5 7v3.5L2 12h14l-1.5-1.5V7A5.5 5.5 0 009 1.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          <path
            d="M7 14a2 2 0 004 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9
              ? '9+'
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">
              Notifications
            </span>

            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <span className="notif-count">
                  {unreadCount} new
                </span>
              )}

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-mark-all"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="notif-empty">
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="notif-empty">
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                opacity="0.35"
              >
                <path
                  d="M18 3A11 11 0 007 14v7L4 24h28l-3-3v-7A11 11 0 0018 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                <path
                  d="M14 28a4 4 0 008 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map(
                (notification, index) => {
                  const notificationId =
                    notification.id ||
                    notification.notification_id ||
                    index;

                  const unread =
                    isNotificationUnread(
                      notification
                    );

                  return (
                    <button
                      type="button"
                      key={notificationId}
                      className={`notif-item ${
                        unread ? 'unread' : ''
                      }`}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                    >
                      <div className="notif-dot" />

                      <div className="notif-content">
                        {notification.title && (
                          <div className="notif-item-title">
                            {notification.title}
                          </div>
                        )}

                        <div className="notif-text">
                          {getNotificationMessage(
                            notification
                          )}
                        </div>

                        <div className="notif-time">
                          {formatNotificationTime(
                            notification.created_at ||
                              notification.createdAt
                          )}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}