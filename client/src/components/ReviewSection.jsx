import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, MessageSquarePlus, Star } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import { formatDate } from '../utils/format';

export default function ReviewSection({ listingType, listingId, reviewState }) {
  const { user } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(reviewState || { canReview: false });
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setState(reviewState || { canReview: false });
  }, [reviewState]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reviews/listing/${listingType}/${listingId}`);
      setReviews(data.items);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [listingType, listingId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const average = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { listingType, listingId, rating, comment });
      toast.success('Your verified review is now live.');
      setComment('');
      setShowForm(false);
      setState((current) => ({
        ...current,
        canReview: false,
        hasReviewed: true,
        reason: 'You have already reviewed this listing.'
      }));
      loadReviews();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="detail-block" id="reviews">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <h2 style={{ marginBottom: 0 }}>Reviews</h2>
        {state.canReview && !showForm && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setShowForm(true)}>
            <MessageSquarePlus size={14} /> Write a review
          </button>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="review-summary">
          <div className="review-score">
            <strong>{average.toFixed(1)}</strong>
            <span className="stars" aria-label={`${average} out of 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={13}
                  style={{ opacity: index < Math.round(average) ? 1 : 0.22 }}
                  aria-hidden="true"
                />
              ))}
            </span>
            <span>{reviews.length} verified review{reviews.length === 1 ? '' : 's'}</span>
          </div>
          <p className="small muted" style={{ maxWidth: 420, lineHeight: 1.6 }}>
            Every review comes from a customer whose enquiry the provider marked as contacted.
            StayMate does not publish anonymous or purchased reviews.
          </p>
        </div>
      ) : (
        <p className="small muted" style={{ lineHeight: 1.65, marginBottom: 14 }}>
          No reviews yet. Reviews appear here only after a customer contacts the provider and
          the provider marks the enquiry as contacted.
        </p>
      )}

      {!state.canReview && state.reason && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <BadgeCheck size={17} />
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>Verified reviews only</strong>
            {state.reason}
            {!user && (
              <>
                {' '}
                <Link to="/login" className="btn-link">Log in</Link>
              </>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <form className="stack" onSubmit={submit} style={{ marginBottom: 22, background: 'var(--surface-2)', padding: 16, borderRadius: 12 }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label>Your rating</label>
            <div className="rating-input" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= (hover || rating) ? 'active' : ''}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star size={24} />
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="review-comment">Your experience</label>
            <textarea
              id="review-comment"
              className="textarea"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share what future customers should know about this stay or food service."
              maxLength={1200}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish review'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="small muted">Loading reviews…</p>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <article className="review-item" key={review.id}>
              <div className="review-head">
                <Avatar src={review.user.avatar} name={review.user.name} size="sm" />
                <div>
                  <h4>{review.user.name}</h4>
                  <p>{formatDate(review.createdAt)}</p>
                </div>
                <span className="verified-badge">
                  <BadgeCheck size={12} /> Verified interaction
                </span>
              </div>
              <div className="stars" style={{ marginTop: 8 }} aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={13}
                    style={{ opacity: index < review.rating ? 1 : 0.22 }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="review-text">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
