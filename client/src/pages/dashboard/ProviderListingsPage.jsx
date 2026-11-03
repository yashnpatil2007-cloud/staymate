import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Eye, MapPin, Pencil, Plus, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import api, { resolveImage } from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { PageLoading } from '../../components/Skeletons';
import { formatCurrency } from '../../utils/format';

const FILTERS = ['all', 'approved', 'pending', 'rejected'];

export default function ProviderListingsPage() {
  usePageMeta('My Food Services', 'Manage your StayMate food listings and meal plans.');
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/food/mine')
      .then(({ data }) => setListings(data.items))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (filter !== 'all' && listing.status !== filter) return false;
      if (!needle) return true;
      return `${listing.businessName} ${listing.city} ${listing.area}`.toLowerCase().includes(needle);
    });
  }, [listings, filter, query]);

  const counts = useMemo(
    () => ({
      all: listings.length,
      approved: listings.filter((item) => item.status === 'approved').length,
      pending: listings.filter((item) => item.status === 'pending').length,
      rejected: listings.filter((item) => item.status === 'rejected').length
    }),
    [listings]
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/food/${deleting._id}`);
      setListings((current) => current.filter((item) => item._id !== deleting._id));
      toast.success('Food service deleted.');
      setDeleting(null);
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>My food services</h2>
          <p>Update your menu, monthly price and meal plans.</p>
        </div>
        <Link to="/provider/listings/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add food service</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {listings.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No food services listed yet"
          description="Create a detailed mess, tiffin or meal-plan listing with real photos, the meals you serve and an accurate monthly price."
          actionLabel="Add your first service"
          actionTo="/provider/listings/new"
        />
      ) : (
        <>
          <div className="manage-toolbar">
            <div className="tabs" style={{ margin: 0 }}>
              {FILTERS.map((status) => (
                <button
                  type="button"
                  key={status}
                  className={`tab ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="count">{counts[status]}</span>
                </button>
              ))}
            </div>
            <label className="search-box" style={{ maxWidth: 280 }}>
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your services"
                aria-label="Search your food services"
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ChefHat}
              title="No services match"
              description="Try another status or clear your search."
              actionLabel="Clear filters"
              onAction={() => {
                setFilter('all');
                setQuery('');
              }}
            />
          ) : (
            <div className="manage-list">
              {filtered.map((listing) => (
                <article className="manage-card" key={listing._id}>
                  <div className="manage-thumb">
                    {listing.images?.[0] ? (
                      <img src={resolveImage(listing.images[0])} alt={listing.businessName} loading="lazy" />
                    ) : (
                      <span className="manage-thumb-fallback"><ChefHat size={22} /></span>
                    )}
                  </div>
                  <div className="manage-main">
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge status={listing.status} />
                      <span className="badge badge-neutral">{listing.type.replace('_', ' ')}</span>
                      {listing.foodType && <span className="badge badge-neutral">{listing.foodType.replace('_', ' ')}</span>}
                    </div>
                    <h3>{listing.businessName}</h3>
                    <p className="small muted"><MapPin size={13} /> {listing.area}, {listing.city}</p>
                    <div className="manage-meta">
                      <span>{formatCurrency(listing.pricePerMonth)}<small>/month</small></span>
                      <span><UtensilsCrossed size={14} /> {listing.mealPlans?.length || 0} plans</span>
                      <span><Eye size={14} /> {listing.views || 0} views</span>
                    </div>
                    {listing.status === 'rejected' && listing.rejectionReason && (
                      <p className="field-error" style={{ marginTop: 6 }}>Rejected: {listing.rejectionReason}</p>
                    )}
                  </div>
                  <div className="manage-actions">
                    <Link to={`/food/${listing._id}`} className="btn btn-outline btn-sm">Preview</Link>
                    <Link to={`/provider/listings/${listing._id}/edit`} className="btn btn-soft btn-sm"><Pencil size={13} /> Edit</Link>
                    <button type="button" className="icon-btn danger" onClick={() => setDeleting(listing)} aria-label={`Delete ${listing.businessName}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => (busy ? null : setDeleting(null))}
        title="Delete this food service?"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete service'}
            </button>
          </>
        )}
      >
        <p className="muted">
          <strong>{deleting?.businessName}</strong> and its meal plans will be removed. Existing enquiries remain for your records.
          This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
