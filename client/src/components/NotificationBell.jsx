import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { timeAgo, ROLE_LABELS, roleHome, settingsPath } from '../utils/format';
import Avatar from './Avatar';

export function notificationsPath(role) {
  if (role === 'admin') return '/admin/notifications';
  if (role === 'owner') return '/owner/notifications';
  if (role === 'food_provider') return '/provider/notifications';
  return '/dashboard/notifications';
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const loadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnread(data.unread);
    } catch {
      // silent polling failure
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    loadCount();
    const timer = setInterval(loadCount, 60000);
    return () => clearInterval(timer);
  }, [user, loadCount]);

  useEffect(() => {
    const onClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const { data } = await api.get('/notifications?limit=6');
        setItems(data.items);
        setUnread(data.unread);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnread(0);
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch {
      // ignore
    }
  };

  const openItem = async (item) => {
    setOpen(false);
    if (!item.read) {
      try {
        await api.patch(`/notifications/${item.id || item._id}/read`);
        setUnread((value) => Math.max(0, value - 1));
      } catch {
        // ignore
      }
    }
    if (item.link) navigate(item.link);
  };

  return (
    <div className="notification-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`icon-btn ${open ? 'is-active' : ''}`}
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notification-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notification-panel">
          <div className="notification-panel-head">
            <h4>Notifications</h4>
            <button type="button" className="btn-link small" onClick={markAll}>
              <CheckCheck size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Mark all read
            </button>
          </div>
          <div className="notification-list">
            {loading && <p className="muted small" style={{ padding: 18 }}>Loading…</p>}
            {!loading && items.length === 0 && (
              <p className="muted small" style={{ padding: 18 }}>
                No notifications yet.
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.id || item._id}
                type="button"
                className={`notification-item ${item.read ? '' : 'unread'}`}
                onClick={() => openItem(item)}
                style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left' }}
              >
                <span className="notification-icon">
                  <Bell size={15} />
                </span>
                <span className="notification-body">
                  <p>{item.title}</p>
                  <span>{item.message}</span>
                  <span className="notification-time">{timeAgo(item.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dropdown-item"
            style={{ borderRadius: 0, justifyContent: 'center', padding: 12, fontWeight: 700, color: 'var(--teal-dark)' }}
            onClick={() => {
              setOpen(false);
              navigate(notificationsPath(user.role));
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => setOpen(false), [navigate]);

  if (!user) return null;

  const dashboard = roleHome(user.role);
  const settings = settingsPath(user.role);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar src={user.avatar} name={user.name} size="sm" />
        <span className="user-menu-name">{user.name}</span>
      </button>
      {open && (
        <div className="dropdown">
          <div className="dropdown-head">
            <p>{user.name}</p>
            <span>{ROLE_LABELS[user.role]}</span>
          </div>
          <button type="button" className="dropdown-item" onClick={() => navigate(dashboard)}>
            Dashboard
          </button>
          <button type="button" className="dropdown-item" onClick={() => navigate(settings)}>
            Account settings
          </button>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => navigate(notificationsPath(user.role))}
          >
            Notifications
          </button>
          <button type="button" className="dropdown-item danger" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
