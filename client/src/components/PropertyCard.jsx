import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Building2, MapPin, Star } from 'lucide-react';
import { resolveImage } from '../api/client';
import { AMENITY_LABELS, PROPERTY_TYPE_LABELS, OCCUPANCY_LABELS, formatCurrency } from '../utils/format';
import SaveButton from './SaveButton';

export function CardImage({ src, alt, icon: Icon = Building2 }) {
  const [failed, setFailed] = useState(false);
  const image = resolveImage(src);
  if (!image || failed) {
    return (
      <div className="img-fallback" role="img" aria-label={alt}>
        <Icon size={32} />
      </div>
    );
  }
  return <img src={image} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export default function PropertyCard({ property, onSavedChange }) {
  const image = property.images?.[0];
  return (
    <article className="listing-card">
      <div className="listing-media">
        <Link to={`/accommodations/${property.id || property._id}`} aria-label={`View ${property.name}`}>
          <CardImage src={image} alt={`${property.name} in ${property.city}`} />
        </Link>
        <div className="listing-media-top">
          <div className="listing-media-badges">
            <span className="badge badge-dark">{PROPERTY_TYPE_LABELS[property.type] || property.type}</span>
            {property.isDemo && <span className="badge badge-demo">Demo listing</span>}
            {property.availableBeds === 0 && <span className="badge badge-danger">Fully occupied</span>}
          </div>
          <SaveButton
            listingType="property"
            listingId={property.id || property._id}
            initialSaved={Boolean(property.isSaved)}
            onChange={onSavedChange}
          />
        </div>
      </div>
      <div className="listing-body">
        <div className="listing-title-row">
          <h3 className="listing-title">
            <Link to={`/accommodations/${property.id || property._id}`}>{property.name}</Link>
          </h3>
          {property.reviewCount > 0 && (
            <span className="rating-inline">
              <Star size={13} aria-hidden="true" />
              {Number(property.ratingAvg).toFixed(1)}
              <span>({property.reviewCount})</span>
            </span>
          )}
        </div>
        <p className="listing-location">
          <MapPin size={14} aria-hidden="true" />
          {property.area}, {property.city}
        </p>
        <div className="listing-meta">
          <span className="chip">
            <BedDouble size={12} /> {property.availableBeds} of {property.totalBeds} beds
          </span>
          <span className="chip">{OCCUPANCY_LABELS[property.occupancy] || property.occupancy}</span>
          {property.amenities?.slice(0, 2).map((amenity) => (
            <span className="chip" key={amenity}>
              {AMENITY_LABELS[amenity] || amenity}
            </span>
          ))}
        </div>
        <div className="listing-price-row">
          <div className="listing-price">
            <strong>
              {formatCurrency(property.rent)}
              <small> /month</small>
            </strong>
            <span>
              {property.deposit > 0 ? `${formatCurrency(property.deposit)} deposit` : 'No deposit listed'}
            </span>
          </div>
          <Link to={`/accommodations/${property.id || property._id}`} className="btn btn-outline btn-sm">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
