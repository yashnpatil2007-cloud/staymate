import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Building2, Eye, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { resolveImage } from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { PageLoading } from '../../components/Skeletons';
import { formatCurrency } from '../../utils/format';

const FILTERS = ['all', 'approved', 'pending', 'rejected', 'draft'];

export default function OwnerListingsPage() {
  usePageMeta('My Listings', 'Manage your StayMate property listings.');
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/properties/mine')
      .then(({ data }) => setProperties(data.items))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return properties.filter((property) => {
      if (filter !== 'all' && property.status !== filter) return false;
      if (!needle) return true;
      return `${property.name} ${property.city} ${property.area}`.toLowerCase().includes(needle);
    });
  }, [properties, filter, query]);

  const counts = useMemo(
    () => ({
      all: properties.length,
      approved: properties.filter((item) => item.status === 'approved').length,
      pending: properties.filter((item) => item.status === 'pending').length,
      rejected: properties.filter((item) => item.status === 'rejected').length,
      draft: properties.filter((item) => item.status === 'draft').length
    }),
    [properties]
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/properties/${deleting._id}`);
      setProperties((current) => current.filter((item) => item._id !== deleting._id));
      toast.success('Listing deleted.');
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
          <h2>My listings</h2>
          <p>Edit availability, pricing and details. Changes are reflected on your public listing immediately.</p>
        </div>
        <Link to="/owner/listings/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add property</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties listed yet"
          description="Create a detailed listing with real photos, accurate rent and clear house rules. Listings are reviewed before going live."
          actionLabel="Add your first property"
          actionTo="/owner/listings/new"
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
                placeholder="Search your listings"
                aria-label="Search your listings"
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No listings match"
              description="Try another status or clear your search."
              actionLabel="Clear filters"
              onAction={() => {
                setFilter('all');
                setQuery('');
              }}
            />
          ) : (
            <div className="manage-list">
              {filtered.map((property) => (
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
                      <span className="badge badge-neutral">{property.type}</span>
                    </div>
                    <h3>{property.name}</h3>
                    <p className="small muted"><MapPin size={13} /> {property.area}, {property.city}</p>
                    <div className="manage-meta">
                      <span>{formatCurrency(property.rent)}<small>/month</small></span>
                      <span><BedDouble size={14} /> {property.availableBeds}/{property.totalBeds} beds</span>
                      <span><Eye size={14} /> {property.views || 0} views</span>
                    </div>
                    {property.status === 'rejected' && property.rejectionReason && (
                      <p className="field-error" style={{ marginTop: 6 }}>Rejected: {property.rejectionReason}</p>
                    )}
                  </div>
                  <div className="manage-actions">
                    <Link to={`/accommodations/${property._id}`} className="btn btn-outline btn-sm">Preview</Link>
                    <Link to={`/owner/listings/${property._id}/edit`} className="btn btn-soft btn-sm"><Pencil size={13} /> Edit</Link>
                    <button type="button" className="icon-btn danger" onClick={() => setDeleting(property)} aria-label={`Delete ${property.name}`}>
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
        title="Delete this listing?"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete listing'}
            </button>
          </>
        )}
      >
        <p className="muted">
          <strong>{deleting?.name}</strong> will be removed from StayMate. Existing enquiries will remain for your records.
          This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
