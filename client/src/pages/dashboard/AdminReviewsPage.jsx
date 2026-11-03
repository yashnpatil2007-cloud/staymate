import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import RatingStars from '../../components/RatingStars';
import { PageLoading } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

const FILTERS = ['approved', 'hidden', 'all'];

export default function AdminReviewsPage() {
  usePageMeta('Moderate Reviews', 'Review, hide or remove customer reviews.');
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    api
      .get(`/admin/reviews?${params.toString()}`)
      .then(({ data }) => {
        setItems(data.items);
        setError('');
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const moderate = async (review, nextStatus) => {
    setBusy(review._id);
    try {
      const { data } = await api.patch(`/admin/reviews/${review._id}`, { status: nextStatus });
      setItems((current) => current.map((item) => (item._id === review._id ? { ...item, ...data.review } : item)));
      toast.success(nextStatus === 'approved' ? 'Review approved.' : 'Review hidden.');
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/reviews/${deleting._id}`);
      setItems((current) => current.filter((item) => item._id !== deleting._id));
      toast.success('Review deleted.');
      setDeleting(null);
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Reviews</h2>
          <p>Only verified customers can review. Hide abusive content or remove reviews that break the rules.</p>
        </div>
      </div>

      <div className="tabs">
        {FILTERS.map((value) => (
          <button type="button" key={value} className={`tab ${status === value ? 'active' : ''}`} onClick={() => setStatus(value)}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <PageLoading />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews found"
          description="Verified customer reviews will appear here for moderation."
        />
      ) : (
        <div className="report-list">
          {items.map((review) => (
            <article className="report-card" key={review._id}>
              <div className="report-head">
                <div className="row" style={{ gap: 10 }}>
                  <Avatar src={review.user?.avatar} name={review.user?.name} size="sm" />
                  <div>
                    <h3>{review.user?.name || 'Deleted member'}{review.user?.isDemo && <span className="badge badge-demo" style={{ marginLeft: 6 }}>Demo</span>}</h3>
                    <p className="small muted">
                      {review.listingType === 'food' ? 'Food service' : 'Property'} review · {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${review.status === 'approved' ? 'badge-green' : 'badge-neutral'}`}>{review.status}</span>
              </div>
              <RatingStars value={review.rating} size={15} showValue />
              {review.title && <strong>{review.title}</strong>}
              {review.comment && <p className="report-details">{review.comment}</p>}
              <div className="report-target">
                <Link
                  to={review.listingType === 'food' ? `/food/${review.listingId}` : `/accommodations/${review.listingId}`}
                  className="link-arrow"
                >
                  View listing
                </Link>
              </div>
              <div className="report-actions">
                <div className="row" style={{ gap: 6 }}>
                  {review.status !== 'approved' && (
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => moderate(review, 'approved')} disabled={busy === review._id}>
                      <Eye size={13} /> Approve
                    </button>
                  )}
                  {review.status !== 'hidden' && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => moderate(review, 'hidden')} disabled={busy === review._id}>
                      <EyeOff size={13} /> Hide
                    </button>
                  )}
                </div>
                <button type="button" className="icon-btn danger" onClick={() => setDeleting(review)} aria-label="Delete review">
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => (deleteBusy ? null : setDeleting(null))}
        title="Delete review?"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>{deleteBusy ? 'Deleting…' : 'Delete review'}</button>
          </>
        )}
      >
        <p className="muted">
          This {deleting?.rating}-star review by <strong>{deleting?.user?.name}</strong> will be permanently deleted and the
          listing rating recalculated. This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
