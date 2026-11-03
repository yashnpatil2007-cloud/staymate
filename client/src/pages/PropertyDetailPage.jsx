import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  Flag,
  GraduationCap,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wifi
} from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import EnquiryModal from '../components/EnquiryModal';
import MapEmbed from '../components/MapEmbed';
import Modal from '../components/Modal';
import PropertyCard, { CardImage } from '../components/PropertyCard';
import ReportModal from '../components/ReportModal';
import ReviewSection from '../components/ReviewSection';
import SaveButton from '../components/SaveButton';
import StatusBadge from '../components/StatusBadge';
import {
  AMENITY_LABELS,
  FURNISHING_LABELS,
  GENDER_LABELS,
  OCCUPANCY_LABELS,
  PROPERTY_TYPE_LABELS,
  formatCurrency,
  formatDate
} from '../utils/format';

const AMENITY_ICONS = {
  wifi: Wifi,
  food: UtensilsCrossed,
  ac: Sparkles,
  security: ShieldCheck,
  parking: Building2,
  laundry: Check,
  attached_bathroom: Check,
  power_backup: Check,
  gym: Check,
  housekeeping: Check
};

export default function PropertyDetailPage() {
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

  const property = data?.property;

  usePageMeta(
    property ? `${property.name} in ${property.area}, ${property.city}` : 'Accommodation',
    property ? `${PROPERTY_TYPE_LABELS[property.type]} in ${property.area}, ${property.city} from ${formatCurrency(property.rent)} per month.` : ''
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setActiveImage(0);
    api
      .get(`/properties/${id}`)
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
      toast.info('Log in to contact the provider or save this listing.');
      navigate(`/login?next=${encodeURIComponent(`/accommodations/${id}`)}`);
      return false;
    }
    if (user.role === 'admin') {
      toast.info('Administrators can review this listing from the admin dashboard.');
      return false;
    }
    return action();
  };

  const openEnquiry = () => {
    if (user && property?.owner?.id && property.owner.id === user.id) {
      toast.info('This is your listing. Manage it from the owner dashboard.');
      navigate('/owner/listings');
      return;
    }
    requireAccount(() => setEnquiryOpen(true));
  };

  const openReport = () => {
    requireAccount(() => setReportOpen(true));
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.name, text: `Check out ${property.name} on StayMate`, url });
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
          <div className="skeleton skeleton-line w-45" style={{ height: 32, marginBottom: 12 }} />
          <div className="skeleton skeleton-line w-70" style={{ height: 16 }} />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="page page-top">
        <div className="container">
          <div className="error-state">
            <span className="empty-icon">
              <Building2 size={26} />
            </span>
            <h2>This accommodation is not available</h2>
            <p>{error || 'The listing may have been removed or is awaiting approval.'}</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
              <Link to="/accommodations" className="btn btn-primary">
                Browse accommodation
              </Link>
              <Link to="/" className="btn btn-outline">Go home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = property.images?.length ? property.images : [];
  const isOwner = user?.id === property.owner?.id;
  const canManage = isOwner || user?.role === 'admin';

  return (
    <div className="page page-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <Link to="/accommodations">Accommodation</Link>
          <ChevronRight size={13} />
          <span>{property.name}</span>
        </nav>

        <div className="detail-gallery">
          <div className="detail-gallery-main">
            {images.length > 0 ? (
              <>
                <CardImage src={images[activeImage]} alt={`${property.name} photo ${activeImage + 1}`} />
                {images.length > 1 && (
                  <button type="button" className="gallery-count" onClick={() => setGalleryOpen(true)}>
                    View all {images.length} photos
                  </button>
                )}
              </>
            ) : (
              <div className="img-fallback" role="img" aria-label={`${property.name} has no photos`}>
                <Building2 size={42} />
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
                aria-label={`View photo ${index + 2}`}
              >
                <CardImage src={image} alt={`${property.name} photo ${index + 2}`} />
              </button>
            ))}
            {images.length < 2 && (
              <div className="detail-gallery-thumb" style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: '0.76rem' }}>
                More photos coming soon
              </div>
            )}
            {images.length === 2 && (
              <div className="detail-gallery-thumb" style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: '0.76rem' }}>
                {property.city}, {property.area}
              </div>
            )}
          </div>
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            <div>
              <div className="detail-badges">
                <span className="badge badge-dark">{PROPERTY_TYPE_LABELS[property.type]}</span>
                <span className="badge badge-teal">{OCCUPANCY_LABELS[property.occupancy]}</span>
                {property.isDemo && <span className="badge badge-demo">Demo listing</span>}
                {property.status !== 'approved' && <StatusBadge status={property.status} />}
                {property.featured && <span className="badge badge-amber">Featured</span>}
              </div>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h1 className="detail-title">{property.name}</h1>
                  <div className="detail-sub">
                    <span>
                      <MapPin size={14} /> {property.area}, {property.city}
                    </span>
                    {property.reviewCount > 0 && (
                      <span>
                        <Star size={14} /> {Number(property.ratingAvg).toFixed(1)} ({property.reviewCount} review{property.reviewCount === 1 ? '' : 's'})
                      </span>
                    )}
                    <span>
                      <BedDouble size={14} /> {property.availableBeds} of {property.totalBeds} beds available
                    </span>
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <SaveButton
                    listingType="property"
                    listingId={property.id}
                    initialSaved={Boolean(property.isSaved)}
                    onChange={(saved) => setData((current) => ({ ...current, property: { ...current.property, isSaved: saved } }))}
                  />
                  <button type="button" className="icon-btn" onClick={share} aria-label="Share listing">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <section className="detail-block">
              <h2>About this stay</h2>
              <p className="description">{property.description}</p>
              {property.collegeNearby && (
                <p className="small muted" style={{ marginTop: 14, display: 'flex', gap: 7, alignItems: 'center' }}>
                  <GraduationCap size={15} /> Close to {property.collegeNearby}
                </p>
              )}
              {property.workplaceNearby && (
                <p className="small muted" style={{ marginTop: 6, display: 'flex', gap: 7, alignItems: 'center' }}>
                  <Building2 size={15} /> Convenient for {property.workplaceNearby}
                </p>
              )}
            </section>

            <section className="detail-block">
              <h2>What this place offers</h2>
              {property.amenities?.length ? (
                <div className="amenities-grid">
                  {property.amenities.map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity] || Check;
                    return (
                      <div className="amenity-item" key={amenity}>
                        <Icon size={16} />
                        <span>{AMENITY_LABELS[amenity] || amenity}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="small muted">The owner has not listed specific amenities yet. Ask through the enquiry form.</p>
              )}
            </section>

            <section className="detail-block">
              <h2>Good to know</h2>
              <div className="price-rows" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
                <div className="price-row"><span>Accommodation type</span><strong>{PROPERTY_TYPE_LABELS[property.type]}</strong></div>
                <div className="price-row"><span>Occupancy</span><strong>{OCCUPANCY_LABELS[property.occupancy]}</strong></div>
                <div className="price-row"><span>Furnishing</span><strong>{FURNISHING_LABELS[property.furnishing]}</strong></div>
                <div className="price-row"><span>Gender preference</span><strong>{GENDER_LABELS[property.genderPreference]}</strong></div>
                <div className="price-row"><span>Available beds</span><strong>{property.availableBeds} of {property.totalBeds}</strong></div>
                <div className="price-row"><span>Listed on</span><strong>{formatDate(property.createdAt)}</strong></div>
              </div>
            </section>

            {property.houseRules?.length > 0 && (
              <section className="detail-block">
                <h2>House rules</h2>
                <ul className="rules-list">
                  {property.houseRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="detail-block">
              <h2>Location</h2>
              <MapEmbed
                coords={property.coordinates}
                name={property.name}
                city={property.city}
                area={property.area}
                address={property.address}
              />
              <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
                Full address: {property.address}, {property.area}, {property.city}. Confirm exact
                entry instructions directly with the owner.
              </p>
            </section>

            <ReviewSection listingType="property" listingId={property.id} reviewState={data.reviewState} />

            <div className="row-between" style={{ paddingTop: 2 }}>
              <button type="button" className="btn-link small" onClick={openReport} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <Flag size={13} /> Report this listing
              </button>
              <Link to="/accommodations" className="btn-link small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <ArrowLeft size={13} /> Back to all accommodation
              </Link>
            </div>
          </div>

          <aside className="detail-side">
            <div className="price-card">
              <div className="price-card-head">
                <strong>{formatCurrency(property.rent)}<small> /month</small></strong>
                <span>{property.deposit > 0 ? `${formatCurrency(property.deposit)} deposit` : 'No deposit listed'}</span>
              </div>
              <div className="price-rows">
                <div className="price-row"><span>Monthly rent</span><strong>{formatCurrency(property.rent)}</strong></div>
                <div className="price-row"><span>Security deposit</span><strong>{property.deposit > 0 ? formatCurrency(property.deposit) : 'Not specified'}</strong></div>
                <div className="price-row"><span>Available beds</span><strong>{property.availableBeds}</strong></div>
                <div className="price-row"><span>Gender preference</span><strong>{GENDER_LABELS[property.genderPreference]}</strong></div>
              </div>
              {canManage ? (
                <Link to={user.role === 'admin' ? '/admin/listings' : '/owner/listings'} className="btn btn-primary btn-block">
                  Manage this listing <ArrowRight size={15} />
                </Link>
              ) : (
                <button type="button" className="btn btn-primary btn-block" onClick={openEnquiry} disabled={property.availableBeds === 0}>
                  <MessageCircle size={16} /> {property.availableBeds === 0 ? 'Fully occupied' : 'Contact owner'}
                </button>
              )}
              <p className="small muted" style={{ marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
                Enquiries go directly to the listing owner. StayMate does not charge a booking fee.
              </p>
            </div>

            <div className="price-card">
              <div className="owner-card">
                <Avatar src={property.owner?.avatar} name={property.owner?.name} size="md" />
                <div className="owner-card-info">
                  <h4>{property.owner?.name || 'Listing owner'}</h4>
                  <p>
                    {property.owner?.role === 'owner' ? 'Property owner' : 'StayMate member'}
                    {property.owner?.isDemo ? ' · Demo account' : ''}
                  </p>
                </div>
              </div>
              <div className="price-rows">
                <div className="price-row"><span>Member since</span><strong>{property.owner?.createdAt ? formatDate(property.owner.createdAt) : '—'}</strong></div>
                <div className="price-row"><span>Response route</span><strong>StayMate enquiry</strong></div>
              </div>
            </div>

            <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
              <ShieldCheck size={18} />
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>Stay safe while searching</strong>
                <span className="small" style={{ lineHeight: 1.55 }}>
                  Visit the property before paying. Never share OTPs or transfer a deposit without
                  verifying the owner and seeing the room.
                </span>
              </div>
            </div>
          </aside>
        </div>

        {data.related?.length > 0 && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Similar stays</span>
                <h2 className="display">Other places you may like</h2>
              </div>
              <Link to={`/accommodations?city=${encodeURIComponent(property.city)}`} className="link-arrow">
                More in {property.city} <ArrowRight size={15} />
              </Link>
            </div>
            <div className="listing-grid">
              {data.related.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {enquiryOpen && (
        <EnquiryModal
          listingType="property"
          listingId={property.id}
          listingName={property.name}
          onClose={() => setEnquiryOpen(false)}
        />
      )}
      {reportOpen && (
        <ReportModal targetType="property" targetId={property.id} onClose={() => setReportOpen(false)} />
      )}
      {galleryOpen && images.length > 0 && (
        <Modal title={`${property.name} photos`} size="lg" onClose={() => setGalleryOpen(false)}>
          <div className="stack-sm">
            {images.map((image, index) => (
              <div className="detail-gallery-main" key={image} style={{ aspectRatio: '16 / 9' }}>
                <CardImage src={image} alt={`${property.name} photo ${index + 1}`} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
