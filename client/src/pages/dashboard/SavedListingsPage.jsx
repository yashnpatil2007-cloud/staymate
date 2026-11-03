import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, UtensilsCrossed } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import PropertyCard from '../../components/PropertyCard';
import FoodCard from '../../components/FoodCard';
import EmptyState from '../../components/EmptyState';
import { ListingSkeletons } from '../../components/Skeletons';

export default function SavedListingsPage() {
  usePageMeta('Saved Listings', 'Your saved accommodation and food services.');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api
      .get('/saved')
      .then(({ data }) => setItems(data.items))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (tab === 'all' ? items : items.filter((item) => item.listingType === tab)),
    [items, tab]
  );

  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id));

  const counts = {
    all: items.length,
    property: items.filter((item) => item.listingType === 'property').length,
    food: items.filter((item) => item.listingType === 'food').length
  };

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Saved listings</h2>
          <p>Everything you bookmarked, in one shortlist.</p>
        </div>
        <Link to="/accommodations" className="btn btn-outline btn-sm"><Search size={14} /> Find more</Link>
      </div>

      <div className="tabs">
        {[
          { value: 'all', label: 'All saved' },
          { value: 'property', label: 'Accommodation' },
          { value: 'food', label: 'Food services' }
        ].map((option) => (
          <button
            type="button"
            key={option.value}
            className={`tab ${tab === option.value ? 'active' : ''}`}
            onClick={() => setTab(option.value)}
          >
            {option.label}<span className="count">{counts[option.value]}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <ListingSkeletons count={6} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={tab === 'food' ? UtensilsCrossed : Heart}
          title={items.length === 0 ? 'Nothing saved yet' : 'No saved listings in this tab'}
          description={
            items.length === 0
              ? 'Tap the heart on any stay or food service to keep it here for later.'
              : 'Switch tabs or save a new listing while browsing.'
          }
          actionLabel="Browse accommodation"
          actionTo="/accommodations"
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="listing-grid two">
          {filtered.map((item) =>
            item.listingType === 'property' ? (
              <PropertyCard
                key={item.id}
                property={item.listing}
                onSavedChange={(saved) => {
                  if (!saved) remove(item.id);
                }}
              />
            ) : (
              <FoodCard
                key={item.id}
                food={item.listing}
                onSavedChange={(saved) => {
                  if (!saved) remove(item.id);
                }}
              />
            )
          )}
        </div>
      )}
    </>
  );
}
