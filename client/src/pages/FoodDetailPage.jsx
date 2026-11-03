import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Flag,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed
} from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import EnquiryModal from '../components/EnquiryModal';
import MapEmbed from '../components/MapEmbed';
import Modal from '../components/Modal';
import FoodCard from '../components/FoodCard';
import { CardImage } from '../components/PropertyCard';
import ReportModal from '../components/ReportModal';
import ReviewSection from '../components/ReviewSection';
import SaveButton from '../components/SaveButton';
import StatusBadge from '../components/StatusBadge';
import {
  FOOD_PREFERENCE_LABELS,
  FOOD_TYPE_LABELS,
  MEAL_LABELS,
  formatCurrency,
  formatDate
} from '../utils/format';

export default function FoodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const food = data?.food;

  usePageMeta(
    food ? `${food.businessName} in ${food.area}, ${food.city}` : 'Food service',
    food ? `${FOOD_TYPE_LABELS[food.type]} in ${food.area}, ${food.city} from ${formatCurrency(food.pricePerMonth)} per month.` : ''
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setActiveImage(0);
    api
      .get(`/food/${id}`)
      .then(({ data: payload }) => {
        if (active) setData(payload);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const requireAccount = (action) => {
    if (!user) {
      toast.info('Log in to contact the food provider or save this listing.');
      navigate(`/login?next=${encodeURIComponent(`/food/${id}`)}`);
      return;
    }
    if (user.role === 'admin') {
      toast.info('Administrators can review this food listing from the admin dashboard.');
      return;
    }
    action();
  };

  const openEnquiry = () => {
    if (user && food?.user?.id === user.id) {
      toast.info('This is your listing. Manage it from the provider dashboard.');
      navigate('/provider/listings');
      return;
    }
    requireAccount(() => setEnquiryOpen(true));
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: food.businessName, text: `Check out ${food.businessName} on StayMate`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard.');
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') toast.error('Could not copy the link.');
    }
  };

  if (loading) {
    return (
      <div className="page page-top">
        <div className="container">
          <div className="skeleton skeleton-line w-45" style={{ height: 18, marginBottom: 20 }} />
          <div className="skeleton detail-gallery-main" style={{ aspectRatio: '16 / 7', marginBottom: 28 }} />
          <div className="skeleton skeleton-line w-45" style={{ height: 32 }} />
        </div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="page page-top">
        <div className="container">
          <div className="error-state">
            <span className="empty-icon"><UtensilsCrossed size={26} /></span>
            <h2>This food service is not available</h2>
            <p>{error || 'The listing may have been removed or is awaiting approval.'}</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
              <Link to="/food" className="btn btn-primary">Browse food services</Link>
              <Link to="/" className="btn btn-outline">Go home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = food.images?.length ? food.images : [];
  const isProvider = user?.id === food.user?.id;
  const canManage = isProvider || user?.role === 'admin';
  const lowestPlan = data.mealPlans?.length ? data.mealPlans[0] : null;

  return (
    <div className="page page-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <Link to="/food">Food & tiffin</Link>
          <ChevronRight size={13} />
          <span>{food.businessName}</span>
        </nav>

        <div className="detail-gallery">
          <div className="detail-gallery-main">
            {images.length > 0 ? (
              <>
                <CardImage src={images[activeImage]} alt={`${food.businessName} food ${activeImage + 1}`} icon={UtensilsCrossed} />
                {images.length > 1 && (
                  <button type="button" className="gallery-count" onClick={() => setGalleryOpen(true)}>
                    View all {images.length} photos
                  </button>
                )}
              </>
            ) : (
              <div className="img-fallback" role="img" aria-label={`${food.businessName} has no photos`}>
                <UtensilsCrossed size={42} />
                <span>No photos provided</span>
              </div>
            )}
          </div>
          <div className="detail-gallery-side">
            {images.slice(1, 3).map((image, index) => (
              <button
                type="button"
                className="detail-gallery-thumb"
                key={image}
                onClick={() => {
                  setActiveImage(index + 1);
                  setGalleryOpen(true);
                }}
                aria-label={`View food photo ${index + 2}`}
              >
                <CardImage src={image} alt={`${food.businessName} photo ${index + 2}`} icon={UtensilsCrossed} />
              </button>
            ))}
            {images.length < 2 && (
              <div className="detail-gallery-thumb" style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: '0.76rem' }}>
                {images.length === 0 ? 'Fresh meals, made daily' : `${food.city} kitchen`}
              </div>
            )}
            {images.length === 2 && (
              <div className="detail-gallery-thumb" style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: '0.76rem' }}>
                {food.city}, {food.area}
              </div>
            )}
          </div>
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            <div>
              <div className="detail-badges">
                <span className="badge badge-dark">{FOOD_TYPE_LABELS[food.type]}</span>
                <span className="badge badge-teal">{FOOD_PREFERENCE_LABELS[food.foodType]}</span>
                {food.isDemo && <span className="badge badge-demo">Demo listing</span>}
                {food.status !== 'approved' && <StatusBadge status={food.status} />}
              </div>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h1 className="detail-title">{food.businessName}</h1>
                  <div className="detail-sub">
                    <span><MapPin size={14} /> {food.area}, {food.city}</span>
                    {food.reviewCount > 0 && (
                      <span><Star size={14} /> {Number(food.ratingAvg).toFixed(1)} ({food.reviewCount} review{food.reviewCount === 1 ? '' : 's'})</span>
                    )}
                    <span><UtensilsCrossed size={14} /> {food.mealAvailability?.length || 0} meals available</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <SaveButton
                    listingType="food"
                    listingId={food.id}
                    initialSaved={Boolean(food.isSaved)}
                    onChange={(saved) => setData((current) => ({ ...current, food: { ...current.food, isSaved: saved } }))}
                  />
                  <button type="button" className="icon-btn" onClick={share} aria-label="Share food service">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <section className="detail-block">
              <h2>About this kitchen</h2>
              <p className="description">{food.description}</p>
            </section>

            <section className="detail-block">
              <h2>Meals available</h2>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {['breakfast', 'lunch', 'dinner'].map((meal) => (
                  <span className={`meal-chip ${food.mealAvailability?.includes(meal) ? 'on' : ''}`} key={meal}>
                    {food.mealAvailability?.includes(meal) && <Check size={12} />}
                    {MEAL_LABELS[meal]}
                  </span>
                ))}
              </div>
              <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
                Monthly price from {formatCurrency(food.pricePerMonth)}. Confirm delivery area, timing
                and any extra charges with the provider before subscribing.
              </p>
            </section>

            {data.mealPlans?.length > 0 && (
              <section className="detail-block">
                <h2>Meal plans</h2>
                <div className="meal-plan-grid">
                  {data.mealPlans.map((plan) => (
                    <article className="meal-plan-card" key={plan._id}>
                      <div className="row-between" style={{ alignItems: 'flex-start', gap: 10 }}>
                        <h3>{plan.name}</h3>
                        <span className="meal-plan-price">{formatCurrency(plan.pricePerMonth)}<small>/mo</small></span>
                      </div>
                      <p className="small muted" style={{ lineHeight: 1.6 }}>{plan.description}</p>
                      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                        {plan.mealsIncluded?.map((meal) => (
                          <span className="chip" key={meal}>{MEAL_LABELS[meal]}</span>
                        ))}
                        <span className="chip">{FOOD_PREFERENCE_LABELS[plan.foodType]}</span>
                      </div>
                      {plan.menu && <p className="plan-menu">{plan.menu}</p>}
                      <button type="button" className="btn btn-outline btn-sm btn-block" onClick={openEnquiry}>
                        Ask about this plan
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {food.menu && (
              <section className="detail-block">
                <h2>Sample menu</h2>
                <div className="menu-block">{food.menu}</div>
              </section>
            )}

            <section className="detail-block">
              <h2>Service details</h2>
              <div className="price-rows" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
                <div className="price-row"><span>Service type</span><strong>{FOOD_TYPE_LABELS[food.type]}</strong></div>
                <div className="price-row"><span>Food preference</span><strong>{FOOD_PREFERENCE_LABELS[food.foodType]}</strong></div>
                <div className="price-row"><span>Monthly price</span><strong>{formatCurrency(food.pricePerMonth)}</strong></div>
                <div className="price-row"><span>Listed on</span><strong>{formatDate(food.createdAt)}</strong></div>
              </div>
            </section>

            <section className="detail-block">
              <h2>Location & delivery</h2>
              <MapEmbed coords={food.coordinates} name={food.businessName} city={food.city} area={food.area} address={food.address} />
              <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
                {food.address ? `${food.address}, ` : ''}{food.area}, {food.city}. Ask the provider
                whether delivery is included in the monthly price.
              </p>
            </section>

            <ReviewSection listingType="food" listingId={food.id} reviewState={data.reviewState} />

            <div className="row-between" style={{ paddingTop: 2 }}>
              <button
                type="button"
                className="btn-link small"
                onClick={() => requireAccount(() => setReportOpen(true))}
                style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
              >
                <Flag size={13} /> Report this food service
              </button>
              <Link to="/food" className="btn-link small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <ArrowLeft size={13} /> Back to all food services
              </Link>
            </div>
          </div>

          <aside className="detail-side">
            <div className="price-card">
              <div className="price-card-head">
                <strong>{formatCurrency(food.pricePerMonth)}<small> /month</small></strong>
                <span>{lowestPlan ? `${formatCurrency(lowestPlan.pricePerMonth)} from plans` : 'Monthly meal service'}</span>
              </div>
              <div className="price-rows">
                <div className="price-row"><span>Service type</span><strong>{FOOD_TYPE_LABELS[food.type]}</strong></div>
                <div className="price-row"><span>Food preference</span><strong>{FOOD_PREFERENCE_LABELS[food.foodType]}</strong></div>
                <div className="price-row"><span>Meals</span><strong>{food.mealAvailability?.map((meal) => MEAL_LABELS[meal]).join(', ') || 'Ask provider'}</strong></div>
                <div className="price-row"><span>Meal plans</span><strong>{data.mealPlans?.length || 0}</strong></div>
              </div>
              {canManage ? (
                <Link to={user.role === 'admin' ? '/admin/food' : '/provider/listings'} className="btn btn-primary btn-block">
                  Manage this listing <ArrowRight size={15} />
                </Link>
              ) : (
                <button type="button" className="btn btn-primary btn-block" onClick={openEnquiry}>
                  <MessageCircle size={16} /> Contact provider
                </button>
              )}
              <p className="small muted" style={{ marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
                Ask about menus, trial meals, delivery and monthly billing before subscribing.
              </p>
            </div>

            <div className="price-card">
              <div className="owner-card">
                <Avatar src={food.user?.avatar} name={food.user?.name} size="md" />
                <div className="owner-card-info">
                  <h4>{food.user?.name || 'Food provider'}</h4>
                  <p>{food.user?.isDemo ? 'Demo food provider' : 'Verified StayMate provider'}</p>
                </div>
              </div>
              <div className="price-rows">
                <div className="price-row"><span>Member since</span><strong>{food.user?.createdAt ? formatDate(food.user.createdAt) : '—'}</strong></div>
                <div className="price-row"><span>Contact route</span><strong>StayMate enquiry</strong></div>
              </div>
            </div>

            <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
              <ShieldCheck size={18} />
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>Try before you subscribe</strong>
                <span className="small" style={{ lineHeight: 1.55 }}>
                  Ask for a trial meal, confirm hygiene and delivery timings, and avoid paying a
                  full month in advance to someone you have not met.
                </span>
              </div>
            </div>

            <div className="price-card">
              <div className="row" style={{ gap: 9 }}>
                <Sparkles size={17} style={{ color: 'var(--teal-dark)' }} />
                <strong style={{ fontSize: '0.86rem' }}>Looking for a room too?</strong>
              </div>
              <p className="small muted" style={{ marginTop: 7, lineHeight: 1.55 }}>
                Find accommodation near your food service and plan both in one place.
              </p>
              <Link to={`/accommodations?city=${encodeURIComponent(food.city)}`} className="btn btn-outline btn-sm btn-block">
                Stays in {food.city}
              </Link>
            </div>
          </aside>
        </div>

        {data.related?.length > 0 && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">More options</span>
                <h2 className="display">Other food services to compare</h2>
              </div>
              <Link to={`/food?city=${encodeURIComponent(food.city)}`} className="link-arrow">
                More in {food.city} <ArrowRight size={15} />
              </Link>
            </div>
            <div className="listing-grid">
              {data.related.map((item) => <FoodCard key={item.id} food={item} />)}
            </div>
          </section>
        )}
      </div>

      {enquiryOpen && (
        <EnquiryModal
          listingType="food"
          listingId={food.id}
          listingName={food.businessName}
          onClose={() => setEnquiryOpen(false)}
        />
      )}
      {reportOpen && (
        <ReportModal targetType="food" targetId={food.id} onClose={() => setReportOpen(false)} />
      )}
      {galleryOpen && images.length > 0 && (
        <Modal title={`${food.businessName} photos`} size="lg" onClose={() => setGalleryOpen(false)}>
          <div className="stack-sm">
            {images.map((image, index) => (
              <div className="detail-gallery-main" key={image} style={{ aspectRatio: '16 / 9' }}>
                <CardImage src={image} alt={`${food.businessName} photo ${index + 1}`} icon={UtensilsCrossed} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
