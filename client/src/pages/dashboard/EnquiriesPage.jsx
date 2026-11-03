import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Inbox, Mail, MessageSquare, Phone } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { PageLoading } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' }
];

export default function EnquiriesPage({ mode = 'mine', listingsPath = '/owner/listings' }) {
  const receivedMode = mode === 'received';
  usePageMeta(
    receivedMode ? 'Received Enquiries' : 'My Enquiries',
    receivedMode ? 'Customer enquiries about your listings.' : 'Enquiries you sent to owners and food providers.'
  );
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get(receivedMode ? '/enquiries/received' : '/enquiries/mine')
      .then(({ data }) => setItems(data.items))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [receivedMode]);

  const updateStatus = async (enquiry, status) => {
    setBusy(enquiry._id);
    try {
      await api.patch(`/enquiries/${enquiry._id}/status`, { status });
      toast.success(`Enquiry marked ${status}.`);
      setItems((current) =>
        current.map((item) => (item._id === enquiry._id ? { ...item, status } : item))
      );
    } catch (updateError) {
      toast.error(updateError.message);
    } finally {
      setBusy('');
    }
  };

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.status === filter)),
    [items, filter]
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      new: items.filter((item) => item.status === 'new').length,
      contacted: items.filter((item) => item.status === 'contacted').length,
      closed: items.filter((item) => item.status === 'closed').length
    }),
    [items]
  );

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>{receivedMode ? 'Customer enquiries' : 'My enquiries'}</h2>
          <p>
            {receivedMode
              ? 'Respond to interested customers and mark enquiries as contacted. That unlocks a verified review.'
              : 'Track the enquiries you sent to owners and food providers.'}
          </p>
        </div>
        <Link to={receivedMode ? listingsPath : '/accommodations'} className="btn btn-outline btn-sm">
          {receivedMode ? 'Manage listings' : 'Browse listings'}
        </Link>
      </div>

      <div className="tabs">
        {STATUS_FILTERS.map((option) => (
          <button
            type="button"
            key={option.value}
            className={`tab ${filter === option.value ? 'active' : ''}`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}<span className="count">{counts[option.value]}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {filtered.length === 0 ? (
        <EmptyState
          icon={receivedMode ? Inbox : MessageSquare}
          title={items.length === 0 ? (receivedMode ? 'No enquiries yet' : 'You have not sent any enquiries') : 'No enquiries with this status'}
          description={
            items.length === 0
              ? receivedMode
                ? 'When a customer contacts one of your listings, their message will appear here.'
                : 'Open a listing and use the contact button to ask about availability, rent or meals.'
              : 'Switch tabs to see enquiries in another status.'
          }
          actionLabel={items.length === 0 ? (receivedMode ? 'View my listings' : 'Browse accommodation') : undefined}
          actionTo={items.length === 0 ? (receivedMode ? listingsPath : '/accommodations') : undefined}
        />
      ) : (
        <div className="enquiry-list">
          {filtered.map((enquiry) => (
            <article className="enquiry-card" key={enquiry._id}>
              <div className="enquiry-head">
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className={`badge ${enquiry.listingType === 'food' ? 'badge-amber' : 'badge-dark'}`}>
                      {enquiry.listingType === 'food' ? 'Food' : 'Stay'}
                    </span>
                    <StatusBadge status={enquiry.status} />
                  </div>
                  <h3>{enquiry.listingName}</h3>
                  <p className="small muted">{formatDate(enquiry.createdAt)}</p>
                </div>
                {enquiry.link && (
                  <Link to={enquiry.link} className="btn btn-outline btn-sm">
                    View listing <ExternalLink size={13} />
                  </Link>
                )}
              </div>

              {receivedMode && (
                <div className="enquiry-contact-row">
                  <span><strong>{enquiry.name}</strong></span>
                  <a href={`mailto:${enquiry.email}`}><Mail size={13} /> {enquiry.email}</a>
                  {enquiry.phone && <a href={`tel:${enquiry.phone}`}><Phone size={13} /> {enquiry.phone}</a>}
                </div>
              )}

              <p className="msg-preview">{enquiry.message}</p>

              {receivedMode && (
                <div className="enquiry-actions">
                  <span className="small muted">Update status:</span>
                  <select
                    className="select"
                    value={enquiry.status}
                    onChange={(event) => updateStatus(enquiry, event.target.value)}
                    disabled={busy === enquiry._id}
                    aria-label={`Status for enquiry from ${enquiry.name}`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                  {enquiry.status !== 'contacted' && (
                    <button
                      type="button"
                      className="btn btn-soft btn-sm"
                      onClick={() => updateStatus(enquiry, 'contacted')}
                      disabled={busy === enquiry._id}
                    >
                      Mark contacted
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
