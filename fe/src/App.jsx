import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import './styles.css';

import HomePage from './pages/guest/HomePage';
import PostDetailPage from './pages/guest/PostDetailPage';
import AuthPage from './pages/guest/AuthPage';
import PlansPage from './pages/guest/PlansPage';
import ContactPage from './pages/guest/ContactPage';
import AboutPage from './pages/guest/AboutPage';
import MyProfilePage from './pages/guest/MyProfilePage';

import AuthorDashboard from './pages/author/AuthorDashboard';
import MyPostsPage from './pages/author/MyPostsPage';
import EditorPage from './pages/author/EditorPage';
import ModerationPage from './pages/author/ModerationPage';
import CategoryManagementPage from './pages/author/CategoryManagementPage';
import TagManagementPage from './pages/author/TagManagementPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import AIMonitorPage from './pages/admin/AIMonitorPage';
import SubscriptionPlanManagementPage from './pages/admin/SubscriptionPlanManagementPage';
import PaymentManagementPage from './pages/admin/PaymentManagementPage';
import AuthorRequestsPage from './pages/admin/AuthorRequestsPage';

import Toast from './components/Toast';
import PublicLayout from './components/PublicLayout';
import NotificationBell from './components/NotificationBell';

import {
  connectSocket,
  disconnectSocket
} from './services/socketClient';

const roleScreens = {
  visitor: [
    'home',
    'plans',
    'contact',
    'about',
    'auth'
  ],

  author: [
    'home',
    'post',
    'plans',
    'contact',
    'about',
    'author',
    'myposts',
    'editor',
    'moderation',
    'categories',
    'tags',
    'payment',
    'profile',
    'auth'
  ],

  admin: [
    'admin',
    'requests',
    'users',
    'posts',
    'categories',
    'tags',
    'subscription',
    'payment',
    'moderation',
    'logs',
    'settings',
    'profile',
    'auth'
  ]
};

const screenComponents = {
  home: HomePage,
  post: PostDetailPage,
  auth: AuthPage,
  plans: PlansPage,
  contact: ContactPage,
  about: AboutPage,

  author: AuthorDashboard,
  myposts: MyPostsPage,
  editor: EditorPage,
  moderation: ModerationPage,
  categories: CategoryManagementPage,
  tags: TagManagementPage,

  admin: AdminDashboard,
  users: UserManagementPage,
  subscription: SubscriptionPlanManagementPage,
  payment: PaymentManagementPage,
  requests: AuthorRequestsPage,

  profile: MyProfilePage,

  // AIMonitorPage hiện đang được dùng làm Activity Logs
  logs: AIMonitorPage
};

function App() {
  const [screen, setScreen] =
    useState('home');

  const [auth, setAuth] = useState({
    user: null,
    role: 'visitor',
    displayName: null,
    email: null,
    token: null
  });

  const [error, setError] = useState('');

  const [showToast, setShowToast] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState('');

  const [editingPost, setEditingPost] =
    useState(null);

  const skipHashHandler = useRef(false);

  const [theme, setTheme] = useState(() => {
    return (
      window.localStorage.getItem(
        'inkwell-theme'
      ) || 'dark'
    );
  });

  useEffect(() => {
    document.body.classList.toggle(
      'light-theme',
      theme === 'light'
    );

    document.body.classList.toggle(
      'dark-theme',
      theme === 'dark'
    );

    window.localStorage.setItem(
      'inkwell-theme',
      theme
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === 'dark' ? 'light' : 'dark'
    );
  };

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        'inkwell-auth'
      );

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed?.user && parsed?.role) {
          setAuth({
            user: parsed.user,
            role: parsed.role,
            displayName:
              parsed.displayName || null,
            email: parsed.email || null,
            token: parsed.token || null
          });
        }
      } catch (error) {
        window.localStorage.removeItem(
          'inkwell-auth'
        );
      }
    }

    const userData =
      window.localStorage.getItem('user');

    if (userData) {
      try {
        const user = JSON.parse(userData);

        setAuth((previous) => ({
          ...previous,
          email: user.email
        }));
      } catch (error) {
        // Không làm gì nếu user data không hợp lệ
      }
    }
  }, []);

  /*
   * Kết nối socket toàn cục.
   *
   * Khi user đã đăng nhập:
   * - connectSocket() tạo kết nối Socket.IO.
   * - Lắng nghe event notification:new.
   * - Hiển thị Toast.
   * - Bắn CustomEvent để NotificationBell cập nhật.
   *
   * Khi user logout:
   * - disconnectSocket() được gọi.
   */
  useEffect(() => {
    if (!auth.user || !auth.token) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket();

    if (!socket) {
      return undefined;
    }

    function handleNewNotification(
      notification
    ) {
      const message =
        notification?.message ||
        notification?.title ||
        'Bạn có thông báo mới';

      // Hiển thị toast toàn cục
      setToastMessage(message);
      setShowToast(true);

      // Gửi event cho NotificationBell
      window.dispatchEvent(
        new CustomEvent('notification:new', {
          detail: notification
        })
      );
    }

    socket.on(
      'notification:new',
      handleNewNotification
    );

    return () => {
      socket.off(
        'notification:new',
        handleNewNotification
      );
    };
  }, [auth.user, auth.token]);

  useEffect(() => {
    const handleHash = () => {
      if (skipHashHandler.current) {
        skipHashHandler.current = false;
        return;
      }

      const rawHash =
        window.location.hash.replace(
          '#',
          ''
        ) || 'home';

      const requested =
        rawHash.startsWith('post/')
          ? 'post'
          : rawHash.startsWith('editor/')
            ? 'editor'
            : rawHash;

      const allowed =
        roleScreens[auth.role] || [];

      if (requested === 'auth') {
        setScreen('auth');
        return;
      }

      if (requested === 'post') {
        setScreen('post');
        return;
      }

      if (requested === 'profile') {
        if (auth.user) {
          setScreen('profile');
        } else {
          setScreen('auth');
          window.location.hash = '#auth';
        }

        return;
      }

      if (allowed.includes(requested)) {
        setScreen(requested);
      } else {
        setScreen(
          auth.role === 'admin'
            ? 'admin'
            : 'home'
        );
      }
    };

    handleHash();

    window.addEventListener(
      'hashchange',
      handleHash
    );

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHash
      );
    };
  }, [auth.role, auth.user]);

  const handleLogin = (result) => {
    if (!result || !result.user) {
      setError('Login failed');
      return false;
    }

    const {
      user,
      accessToken,
      token
    } = result;

    const roles = user.roles || [];

    const roleNames = Array.isArray(roles)
      ? roles.map((role) =>
          role.name || role
        )
      : [];

    const nextRole = roleNames.includes(
      'admin'
    )
      ? 'admin'
      : 'author';

    const target =
      nextRole === 'admin'
        ? 'admin'
        : 'home';

    const authToken =
      accessToken ||
      token ||
      user.token ||
      null;

    const authState = {
      user: user.id,
      role: nextRole,
      displayName: user.name,
      email: user.email,
      token: authToken
    };

    skipHashHandler.current = true;

    window.localStorage.setItem(
      'inkwell-auth',
      JSON.stringify(authState)
    );

    setAuth(authState);
    setScreen(target);
    setError('');

    window.location.hash = `#${target}`;

    setToastMessage(
      `Welcome, ${user.name}!`
    );

    setShowToast(true);

    return true;
  };

  const logout = () => {
    // Ngắt Socket.IO trước khi xóa auth
    disconnectSocket();

    setAuth({
      user: null,
      role: 'visitor',
      displayName: null,
      email: null,
      token: null
    });

    setError('');
    setScreen('home');
    setEditingPost(null);

    window.localStorage.removeItem(
      'inkwell-auth'
    );

    window.localStorage.removeItem(
      'user'
    );

    window.location.hash = '#home';
  };

  const allowedScreens = useMemo(() => {
    return (
      roleScreens[auth.role] ||
      roleScreens.visitor
    );
  }, [auth.role]);

  const handleSelect = (key) => {
    if (key === 'auth') {
      if (auth.user) {
        logout();
      } else {
        setScreen('auth');
        window.location.hash = '#auth';
      }

      return;
    }

    if (key === 'profile') {
      if (auth.user) {
        setScreen('profile');
        window.location.hash = '#profile';
      } else {
        setScreen('auth');
        window.location.hash = '#auth';
      }

      return;
    }

    if (
      key === 'plans' &&
      auth.role === 'visitor'
    ) {
      setScreen('auth');
      window.location.hash = '#auth';
      return;
    }

    if (!allowedScreens.includes(key)) {
      setScreen('home');
      window.location.hash = '#home';
      return;
    }

    if (key === 'editor') {
      setEditingPost(null);
    }

    setScreen(key);
    window.location.hash = `#${key}`;
  };

  const onEditPost = (post) => {
    setEditingPost(post);
    setScreen('editor');
    window.location.hash = `#editor/${post.id}`;
  };

  const onCreateNewPost = () => {
    setEditingPost(null);
    setScreen('editor');
    window.location.hash = '#editor';
  };

  const showAppToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  /*
   * Điều hướng khi người dùng click vào một notification
   * trong NotificationBell (dropdown).
   *
   * NotificationBell chỉ gọi callback này khi notification
   * có entity_type + entity_id (xem NotificationBell.jsx),
   * nên ở đây chỉ cần map entity_type -> screen tương ứng.
   *
   * Mở rộng thêm case khi backend trả về entity_type mới
   * (ví dụ 'comment', 'user', 'payment', ...).
   */
  const handleNotificationNavigate = (notification) => {
    const entityType = notification.entity_type;
    const entityId = notification.entity_id;

    if (!entityId) {
      return;
    }

    switch (entityType) {
      case 'post':
      case 'comment':
        setScreen('post');
        window.location.hash = `#post/${entityId}`;
        break;

      case 'payment':
        if (allowedScreens.includes('payment')) {
          setScreen('payment');
          window.location.hash = '#payment';
        }
        break;

      case 'author_request':
        if (allowedScreens.includes('requests')) {
          setScreen('requests');
          window.location.hash = '#requests';
        }
        break;

      default:
        break;
    }
  };

  const pageProps = {
    auth,
    theme,
    screen,
    onNavigate: handleSelect,
    editingPost,
    onEditPost,
    onCreateNewPost,
    onShowToast: showAppToast,
    onToggleTheme: toggleTheme,
    onRequireLogin: () => {
      setScreen('auth');
      window.location.hash = '#auth';
    },
    onLogin: handleLogin,
    onLogout: logout,
    loginError: error
  };

  const publicScreens = [
    'home',
    'post',
    'plans',
    'contact',
    'about',
    'profile'
  ];

  const ScreenComponent =
    screenComponents[screen] ||
    HomePage;

  const pageContent =
    screen === 'auth' ? (
      <AuthPage {...pageProps} />
    ) : (
      <ScreenComponent {...pageProps} />
    );

  const renderedScreen =
    publicScreens.includes(screen) ? (
      <PublicLayout
        auth={auth}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        {pageContent}
      </PublicLayout>
    ) : (
      pageContent
    );

  return (
    <div className="app-shell">
      {auth.user && (
        <div
          className="app-notification-bell"
          style={{
            position: 'fixed',
            top: '14px',
            right: '20px',
            zIndex: 1000
          }}
        >
          <NotificationBell
            auth={auth}
            onNotificationReceived={handleNotificationNavigate}
          />
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          duration={3000}
          onClose={() =>
            setShowToast(false)
          }
        />
      )}

      {renderedScreen}
    </div>
  );
}

export default App;