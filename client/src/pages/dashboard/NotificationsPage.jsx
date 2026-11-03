import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { PageLoading } from '../../components/Skeletons';
import { timeAgo } from '../../utils/format';

export default function NotificationsPage() {
  usePageMeta('Notifications', 'Updates about enquiries, roommate requests and listing approvals.');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const page = Number(new URLSearchParams(location.search).get('page') || 1);
  const isAdmin = location.pathname.startsWith('/admin');

  const load = () => {
    setLoading(true);
    api
      .get(`/notifications?page=${page}&limit=20`)
      .then(({ data }) => {
        setItems(data.items);
        setPagination(data.pagination);
        setUnread(data.unread);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const markAll = async () => {
    setBusy('all');
    try {
      await api.patch('/notifications/read-all');
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
      toast.success('All notifications marked as read.');
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setItems((current) =>
          current.map((item) => (item._id === notification._id ? { ...item, read: true } : item))
        );
        setUnread((current) => Math.max(0, current - 1));
      } catch {
        // Opening the linked page is still useful if the read flag fails.
      }
    }
    if (notification.link) navigate(notification.link);
  };

  const remove = async (notification) => {
    setBusy(notification._id);
    try {
      await api.delete(`/notifications/${notification._id}`);
      setItems((current) => current.filter((item) => item._id !== notification._id));
      if (!notification.read) setUnread((current) => Math.max(0, current - 1));
      toast.success('Notification removed.');
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const changePage = (next) => {
    const base = location.pathname;
    navigate(`${base}?page=${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Notifications</h2>
          <p>{unread > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}.` : 'You are all caught up.'}</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={markAll} disabled={unread === 0 || busy === 'all'}>
          <CheckCheck size={14} /> {busy === 'all' ? 'Marking…' : 'Mark all read'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Updates about enquiries, roommate requests and listing approvals will appear here."
        />
      ) : (
        <>
          <div className="notification-page-list">
            {items.map((notification) => (
              <article className={`notification-page-item ${notification.read ? '' : 'unread'}`} key={notification._id}>
                <button type="button" className="notification-main" onClick={() => openNotification(notification)}>
                  <span className="activity-icon"><Bell size={15} /></span>
                  <span className="notification-copy">
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small>{timeAgo(notification.createdAt)}</small>
                  </span>
                  {!notification.read && <span className="unread-dot" aria-label="Unread" />}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => remove(notification)}
                  aria-label="Delete notification"
                  disabled={busy === notification._id}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
          <Pagination pagination={pagination} onChange={changePage} />
        </>
      )}

      {isAdmin && (
        <p className="small muted" style={{ marginTop: 16 }}>
          Admin notifications include new listing submissions and customer reports.
        </p>
      )}
    </>
  );
}
