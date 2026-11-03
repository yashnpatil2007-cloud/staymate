import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChefHat, ExternalLink, Search, UtensilsCrossed, X } from 'lucide-react';
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

export default function AdminFoodPage() {
  usePageMeta('Moderate Food Services', 'Approve or reject food and meal listings.');
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
      .get(`/admin/food?${params.toString()}`)
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

  const moderate = async (food, payload, message) => {
    setBusy(food._id);
    try {
      const { data } = await api.patch(`/admin/food/${food._id}`, payload);
      setItems((current) => current.map((item) => (item._id === food._id ? { ...item, ...data.food } : item)));
      toast.success(message);
      if (payload.status && status !== 'all' && payload.status !== status) {
        setItems((current) => current.filter((item) => item._id !== food._id));
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
      await moderate(rejecting, { status: 'rejected', rejectionReason: reason.trim() }, 'Food service rejected.');
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
          <h2>Moderate food services</h2>
          <p>Check menus, photos and pricing before approving a listing.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search service, city or area" aria-label="Search food services" />
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
          icon={ChefHat}
          title={status === 'pending' ? 'Nothing to review' : 'No food services found'}
          description={status === 'pending' ? 'All food submissions have been reviewed.' : 'Try another status or search term.'}
        />
      ) : (
        <div className="manage-list">
          {items.map((food) => (
            <article className="manage-card" key={food._id}>
              <div className="manage-thumb">
                {food.images?.[0] ? (
                  <img src={resolveImage(food.images[0])} alt={food.businessName} loading="lazy" />
                ) : (
                  <span className="manage-thumb-fallback"><ChefHat size={22} /></span>
                )}
              </div>
              <div className="manage-main">
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge status={food.status} />
                  <span className="badge badge-neutral">{food.type.replace('_', ' ')}</span>
                  <span className="badge badge-neutral">{food.foodType.replace('_', ' ')}</span>
                </div>
                <h3>{food.businessName}</h3>
                <p className="small muted">
                  {food.area}, {food.city} · {food.user?.name || 'Unknown provider'}
                  {food.user?.isDemo ? ' (demo)' : ''} · {formatDate(food.createdAt)}
                </p>
                <div className="manage-meta">
                  <span>{formatCurrency(food.pricePerMonth)}<small>/month</small></span>
                  <span><UtensilsCrossed size={14} /> {food.mealAvailability?.join(', ')}</span>
                  <span>{food.user?.email}</span>
                </div>
                {food.status === 'rejected' && food.rejectionReason && (
                  <p className="field-error" style={{ marginTop: 6 }}>Reason: {food.rejectionReason}</p>
                )}
              </div>
              <div className="manage-actions admin-actions">
                <Link to={`/food/${food._id}`} className="btn btn-outline btn-sm">View <ExternalLink size={12} /></Link>
                {food.status !== 'approved' && (
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => moderate(food, { status: 'approved' }, 'Food service approved.')} disabled={busy === food._id}>
                    <Check size={13} /> Approve
                  </button>
                )}
                {food.status !== 'rejected' && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setRejecting(food); setReason(''); }} disabled={busy === food._id}>
                    <X size={13} /> Reject
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onChange={(next) => setPage(next)} />

      <Modal
        open={Boolean(rejecting)}
        onClose={() => (rejectBusy ? null : setRejecting(null))}
        title="Reject food service"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setRejecting(null)} disabled={rejectBusy}>Cancel</button>
            <button type="submit" form="reject-food-form" className="btn btn-danger" disabled={rejectBusy}>{rejectBusy ? 'Rejecting…' : 'Reject listing'}</button>
          </>
        )}
      >
        <form id="reject-food-form" className="stack" onSubmit={submitReject}>
          <p className="muted small">The provider sees this reason and can update the listing.</p>
          <div className="field">
            <label htmlFor="reject-food-reason">Reason *</label>
            <textarea id="reject-food-reason" className="textarea" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={500} placeholder="e.g. Menu is incomplete; photos are stock images; monthly price is missing." />
          </div>
        </form>
      </Modal>
    </>
  );
}
