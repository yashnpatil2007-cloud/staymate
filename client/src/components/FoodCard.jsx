import { Link } from 'react-router-dom';
import { MapPin, Star, UtensilsCrossed } from 'lucide-react';
import {
  FOOD_PREFERENCE_LABELS,
  FOOD_TYPE_LABELS,
  MEAL_LABELS,
  formatCurrency
} from '../utils/format';
import SaveButton from './SaveButton';
import { CardImage } from './PropertyCard';

export default function FoodCard({ food, onSavedChange }) {
  const meals = ['breakfast', 'lunch', 'dinner'];
  return (
    <article className="listing-card food-card">
      <div className="listing-media">
        <Link to={`/food/${food.id || food._id}`} aria-label={`View ${food.businessName}`}>
          <CardImage
            src={food.images?.[0]}
            alt={`${food.businessName} food service`}
            icon={UtensilsCrossed}
          />
        </Link>
        <div className="listing-media-top">
          <div className="listing-media-badges">
            <span className="badge badge-dark">{FOOD_TYPE_LABELS[food.type] || food.type}</span>
            {food.isDemo && <span className="badge badge-demo">Demo listing</span>}
          </div>
          <SaveButton
            listingType="food"
            listingId={food.id || food._id}
            initialSaved={Boolean(food.isSaved)}
            onChange={onSavedChange}
          />
        </div>
      </div>
      <div className="listing-body">
        <div className="listing-title-row">
          <h3 className="listing-title">
            <Link to={`/food/${food.id || food._id}`}>{food.businessName}</Link>
          </h3>
          {food.reviewCount > 0 && (
            <span className="rating-inline">
              <Star size={13} aria-hidden="true" />
              {Number(food.ratingAvg).toFixed(1)}
              <span>({food.reviewCount})</span>
            </span>
          )}
        </div>
        <p className="listing-location">
          <MapPin size={14} aria-hidden="true" />
          {food.area}, {food.city}
        </p>
        <div className="listing-meta">
          <span className="chip">{FOOD_PREFERENCE_LABELS[food.foodType] || food.foodType}</span>
          {meals.map((meal) => (
            <span
              key={meal}
              className={`meal-chip ${food.mealAvailability?.includes(meal) ? 'on' : ''}`}
            >
              {MEAL_LABELS[meal]}
            </span>
          ))}
        </div>
        <div className="listing-price-row">
          <div className="listing-price">
            <strong className="food-price">
              {formatCurrency(food.pricePerMonth)}
              <small> /month</small>
            </strong>
            <span>{food.menu ? food.menu.split('\n')[0].slice(0, 40) : 'Monthly meal plan'}</span>
          </div>
          <Link to={`/food/${food.id || food._id}`} className="btn btn-outline btn-sm">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
