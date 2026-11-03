import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock3, Inbox, Mail, Phone, Send, UserRound, Users, X } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { PageLoading } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

export default function RoommateRequestsPage() {
  usePageMeta('Roommate Requests', 'Manage roommate requests you received and sent.');
  const toast = useToast();
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/roommates/requests/received'), api.get('/roommates/requests/sent')])
      .then(([receivedRes, sentRes]) => {
        setReceived(receivedRes.data.items);
        setSent(sentRes.data.items);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const respond = async (request, action) => {
    setBusy(`${request.id}-${action}`);
    try {
      await api.patch(`/roommates/requests/${request.id}`, { action });
      toast.success(action === 'accept' ? 'Request accepted. Contact details are now available.' : 'Request declined.');
      const { data } = await api.get('/roommates/requests/received');
      setReceived(data.items);
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const cancel = async (request) => {
    setBusy(`${request.id}-cancel`);
    try {
      await api.delete(`/roommates/requests/${request.id}`);
      toast.success('Request cancelled.');
      setSent((current) =>
        current.map((item) => (item.id === request.id ? { ...item, status: 'cancelled' } : item))
      );
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const list = tab === 'received' ? received : sent;
  const pendingReceived = received.filter((item) => item.status === 'pending').length;

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Roommate requests</h2>
          {message && <p>{message}</p>}
          <p>Accept only the people you would be comfortable sharing a home with.</p>
        </div>
        <Link to="/roommates" className="btn btn-outline btn-sm"><Users size={14} /> Find roommates</Link>
      </div>

      <div className="tabs">
        <button type="button" className={`tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          Received<span className="count">{received.length}</span>
        </button>
        <button type="button" className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
          Sent<span className="count">{sent.length}</span>
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'received' ? Inbox : Send}
          title={tab === 'received' ? 'No requests received' : 'No requests sent'}
          description={
            tab === 'received'
              ? 'When someone is interested in living with you, their request will appear here.'
              : 'Browse compatible profiles and send a short introduction to start a conversation.'
          }
          actionLabel="Browse roommates"
          actionTo="/roommates"
        />
      ) : (
        <div className="request-list">
          {list.map((request) => (
            <article className="request-card" key={request.id}>
              <div className="request-main">
                <Avatar src={request.user?.avatar} name={request.user?.name} size="md" />
                <div className="request-info">
                  <div className="row" style={{ gap: 8 }}>
                    <h3>{request.user?.name || 'Member'}</h3>
                    <StatusBadge status={request.status} />
                    {request.user?.isDemo && <span className="badge badge-demo">Demo</span>}
                  </div>
                  <p>
                    {request.profile?.city || request.user?.city || 'City not listed'}
                    {request.profile?.occupation ? ` · ${request.profile.occupation.replace('_', ' ')}` : ''}
                    {request.compatibility !== null && request.compatibility !== undefined ? ` · ${request.compatibility}% match` : ''}
                  </p>
                  {request.message && <p className="msg-preview" style={{ marginTop: 8 }}>{request.message}</p>}
                  <span className="request-date"><Clock3 size={12} /> {formatDate(request.createdAt)}</span>
                  {request.status === 'accepted' && request.user?.phone && (
                    <div className="request-contact">
                      <a href={`tel:${request.user.phone}`}><Phone size={13} /> {request.user.phone}</a>
                      {request.user.email && <a href={`mailto:${request.user.email}`}><Mail size={13} /> {request.user.email}</a>}
                    </div>
                  )}
                </div>
              </div>
              <div className="request-actions">
                {request.profile?.id && (
                  <Link to={`/roommates/${request.profile.id}`} className="btn btn-outline btn-sm">
                    View profile
                  </Link>
                )}
                {tab === 'received' && request.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => respond(request, 'accept')}
                      disabled={Boolean(busy)}
                    >
                      <Check size={14} /> {busy === `${request.id}-accept` ? 'Accepting…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => respond(request, 'reject')}
                      disabled={Boolean(busy)}
                    >
                      <X size={14} /> Decline
                    </button>
                  </>
                )}
                {tab === 'sent' && request.status === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => cancel(request)}
                    disabled={Boolean(busy)}
                  >
                    {busy === `${request.id}-cancel` ? 'Cancelling…' : 'Cancel request'}
                  </button>
                )}
                {request.status === 'accepted' && (
                  <Link to="/dashboard/connections" className="btn btn-soft btn-sm">
                    <UserRound size={14} /> Connected
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {pendingReceived > 0 && tab === 'sent' && (
        <div className="alert alert-info" style={{ marginTop: 18 }}>
          <Inbox size={17} />
          <div>
            You have {pendingReceived} request{pendingReceived === 1 ? '' : 's'} waiting for your reply.
            <button type="button" className="btn-link" style={{ marginLeft: 6 }} onClick={() => setTab('received')}>
              Review received <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
