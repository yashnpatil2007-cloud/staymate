import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, ExternalLink, Search, Star, X } from 'lucide-react';
import api, { resolveImage } from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { PageLoading } from '../../components/Skeletons';
import { formatCurrency, formatDate } from '../../utils/format';

const FILTERS = ['pending', 'approved', 'rejected', 'all'];

export default function AdminListingsPage() {
  usePageMeta('Moderate Properties', 'Approve, reject and feature property listings.');
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status !== 'all') params.set('status', status);
    if (query.trim()) params.set('q', query.trim());
    api
      .get(`/admin/properties?${params.toString()}`)
      .then(({ data }) => {
        setItems(data.items);
        setPagination(data.pagination);
        setError('');
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [status, query, page]);

  const moderate = async (property, payload, message) => {
    setBusy(property._id);
    try {
      const { data } = await api.patch(`/admin/properties/${property._id}`, payload);
      setItems((current) => current.map((item) => (item._id === property._id ? { ...item, ...data.property } : item)));
      toast.success(message);
      if (payload.status && status !== 'all' && payload.status !== status) {
        setItems((current) => current.filter((item) => item._id !== property._id));
        setPagination((current) => (current ? { ...current, total: Math.max(0, current.total - 1) } : current));
      }
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const submitReject = async (event) => {
    event.preventDefault();
    if (!rejecting) return;
    setRejectBusy(true);
    try {
      await moderate(rejecting, { status: 'rejected', rejectionReason: reason.trim() }, 'Property rejected.');
      setRejecting(null);
      setReason('');
    } finally {
      setRejectBusy(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Moderate properties</h2>
          <p>Check that listings are real, complete and safe before approving.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search property, city or area" aria-label="Search properties" />
        </label>
        <div className="tabs" style={{ margin: 0 }}>
          {FILTERS.map((value) => (
            <button type="button" key={value} className={`tab ${status === value ? 'active' : ''}`} onClick={() => { setStatus(value); setPage(1); }}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        {pagination && <span className="small muted">{pagination.total} listing{pagination.total === 1 ? '' : 's'}</span>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <PageLoading />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={status === 'pending' ? 'Nothing to review' : 'No listings found'}
          description={status === 'pending' ? 'All property submissions have been reviewed.' : 'Try another status or search term.'}
        />
      ) : (
        <div className="manage-list">
          {items.map((property) => (
            <article className="manage-card" key={property._id}>
              <div className="manage-thumb">
                {property.images?.[0] ? (
                  <img src={resolveImage(property.images[0])} alt={property.name} loading="lazy" />
                ) : (
                  <span className="manage-thumb-fallback"><Building2 size={22} /></span>
                )}
              </div>
              <div className="manage-main">
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge status={property.status} />
                  {property.featured && <span className="badge badge-amber"><Star size={11} /> Featured</span>}
                  <span className="badge badge-neutral">{property.type}</span>
                </div>
                <h3>{property.name}</h3>
                <p className="small muted">
                  {property.area}, {property.city} · {property.owner?.name || 'Unknown owner'}
                  {property.owner?.isDemo ? ' (demo)' : ''} · {formatDate(property.createdAt)}
                </p>
                <div className="manage-meta">
                  <span>{formatCurrency(property.rent)}<small>/month</small></span>
                  <span>{property.availableBeds}/{property.totalBeds} beds</span>
                  <span>{property.owner?.email}</span>
                </div>
                {property.status === 'rejected' && property.rejectionReason && (
                  <p className="field-error" style={{ marginTop: 6 }}>Reason: {property.rejectionReason}</p>
                )}
              </div>
              <div className="manage-actions admin-actions">
                <Link to={`/accommodations/${property._id}`} className="btn btn-outline btn-sm">View <ExternalLink size={12} /></Link>
                {property.status !== 'approved' && (
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => moderate(property, { status: 'approved' }, 'Property approved.')} disabled={busy === property._id}>
                    <Check size={13} /> Approve
                  </button>
                )}
                {property.status !== 'rejected' && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setRejecting(property); setReason(''); }} disabled={busy === property._id}>
                    <X size={13} /> Reject
                  </button>
                )}
                <button type="button" className={`btn btn-sm ${property.featured ? 'btn-dark' : 'btn-ghost'}`} onClick={() => moderate(property, { featured: !property.featured }, property.featured ? 'Removed from featured.' : 'Added to featured.')} disabled={busy === property._id}>
                  <Star size={13} /> {property.featured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onChange={(next) => setPage(next)} />

      <Modal
        open={Boolean(rejecting)}
        onClose={() => (rejectBusy ? null : setRejecting(null))}
        title="Reject property listing"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setRejecting(null)} disabled={rejectBusy}>Cancel</button>
            <button type="submit" form="reject-property-form" className="btn btn-danger" disabled={rejectBusy}>{rejectBusy ? 'Rejecting…' : 'Reject listing'}</button>
          </>
        )}
      >
        <form id="reject-property-form" className="stack" onSubmit={submitReject}>
          <p className="muted small">The owner sees this reason and can update the listing.</p>
          <div className="field">
            <label htmlFor="reject-reason">Reason *</label>
            <textarea id="reject-reason" className="textarea" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={500} placeholder="e.g. Photos do not match the property; rent is missing; address is incomplete." />
          </div>
        </form>
      </Modal>
    </>
  );
}
