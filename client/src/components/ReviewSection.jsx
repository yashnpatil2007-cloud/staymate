import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BadgeCheck, MessageSquarePlus, Star, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import { formatDate } from '../utils/format';

const REVIEWER_TYPES = [
  { value: 'student', label: 'College Student', icon: '🎓' },
  { value: 'working_professional', label: 'Working Professional / Employee', icon: '💼' },
  { value: 'resident', label: 'Current / Past Resident', icon: '🏠' },
  { value: 'visitor', label: 'Visited / Checked Out', icon: '👀' }
];

export default function ReviewSection({ listingType, listingId, reviewState }) {
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(reviewState || { canReview: false });
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [reviewerType, setReviewerType] = useState('student');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const loadEligibility = useCallback(async () => {
    if (!user) {
      setState({
        canReview: false,
        reason: 'Log in as a student, employee, or resident to share your review.',
        hasReviewed: false
      });
      return;
    }
    try {
      const { data } = await api.get(`/reviews/eligibility/${listingType}/${listingId}`);
      setState(data);
    } catch {
      // Ignored for unauthenticated or network edge cases
    }
  }, [user, listingType, listingId]);

  useEffect(() => {
    if (reviewState) {
      setState(reviewState);
    } else {
      loadEligibility();
    }
  }, [reviewState, loadEligibility]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reviews/listing/${listingType}/${listingId}`);
      setReviews(data.items || []);
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
    if (comment.trim().length < 5) {
      setError('Please write at least 5 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { listingType, listingId, rating, comment, reviewerType });
      toast.success('Your review is live and visible to everyone!');
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
      setError(submitError.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setDeletingId(reviewId);
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Review deleted.');
      loadReviews();
      loadEligibility();
    } catch (err) {
      toast.error(err.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  const getBadgeInfo = (type) => {
    return REVIEWER_TYPES.find((t) => t.value === type) || {
      value: 'resident',
      label: 'Verified Member',
      icon: '✓'
    };
  };

  return (
    <section className="detail-block" id="reviews">
      <div className="row-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Reviews & Experiences</h2>
          <p className="small muted">
            Real feedback from students, employees, and residents.
          </p>
        </div>
        <div>
          {state.canReview && !showForm && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowForm(true)}
            >
              <MessageSquarePlus size={14} /> Write a review
            </button>
          )}

          {!user && (
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="btn btn-soft btn-sm"
            >
              <MessageSquarePlus size={14} /> Log in to review
            </Link>
          )}

          {state.hasReviewed && (
            <span
              className="reviewer-badge resident"
              style={{ display: 'inline-flex', padding: '6px 12px' }}
            >
              <BadgeCheck size={14} /> You reviewed this
            </span>
          )}
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="review-summary">
          <div className="review-score">
            <strong>{average.toFixed(1)}</strong>
            <span className="stars" aria-label={`${average} out of 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  style={{ opacity: index < Math.round(average) ? 1 : 0.22 }}
                  aria-hidden="true"
                />
              ))}
            </span>
            <span>
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          <p className="small muted" style={{ maxWidth: 440, lineHeight: 1.6 }}>
            Every review is written by verified community members who have stayed, dined, or
            inspected this listing. All ratings are public and permanently transparent.
          </p>
        </div>
      ) : (
        <p className="small muted" style={{ lineHeight: 1.65, marginBottom: 16 }}>
          No reviews yet. Be the first student or employee to share what living or dining here is
          really like!
        </p>
      )}

      {showForm && (
        <form
          className="stack"
          onSubmit={submit}
          style={{
            marginBottom: 24,
            background: 'var(--surface-2)',
            padding: 20,
            borderRadius: 14,
            border: '1px solid var(--line)'
          }}
        >
          <div className="row-between" style={{ alignItems: 'baseline' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Write your honest review</h3>
            <span className="small muted">Visible to all visitors</span>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Who are you?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {REVIEWER_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setReviewerType(type.value)}
                  className={`btn btn-sm ${
                    reviewerType === type.value ? 'btn-primary' : 'btn-outline'
                  }`}
                  style={{ borderRadius: 20 }}
                >
                  <span style={{ marginRight: 4 }}>{type.icon}</span> {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Overall rating</label>
            <div className="rating-input" onMouseLeave={() => setHover(0)} style={{ marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= (hover || rating) ? 'active' : ''}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star size={26} />
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="review-comment" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Your experience & advice
            </label>
            <textarea
              id="review-comment"
              className="textarea"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What should students and working professionals know? Mention cleanliness, food taste, Wi-Fi reliability, safety, landlord friendliness, or commute convenience."
              rows={4}
              maxLength={1200}
              required
            />
          </div>

          <div className="form-actions" style={{ marginTop: 6 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish Review'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="small muted">Loading reviews…</p>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => {
            const badge = getBadgeInfo(review.reviewerType);
            const canDelete =
              user &&
              (user.role === 'admin' ||
                user.id === review.user?.id ||
                user.id === review.user?._id);

            return (
              <article className="review-item" key={review.id}>
                <div className="review-head">
                  <Avatar src={review.user?.avatar} name={review.user?.name} size="sm" />
                  <div>
                    <h4>{review.user?.name || 'StayMate Member'}</h4>
                    <p>{formatDate(review.createdAt)}</p>
                  </div>

                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`reviewer-badge ${review.reviewerType || 'resident'}`}>
                      {badge.icon} {badge.label}
                    </span>
                    {review.verifiedInteraction && (
                      <span className="verified-badge" title="Verified community member">
                        <BadgeCheck size={12} /> Verified
                      </span>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="review-delete-btn"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        title="Delete this review"
                        aria-label="Delete review"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="stars"
                  style={{ marginTop: 8 }}
                  aria-label={`${review.rating} out of 5 stars`}
                >
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
            );
          })}
        </div>
      )}
    </section>
  );
}
