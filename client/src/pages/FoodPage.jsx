import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Search, SlidersHorizontal, UtensilsCrossed, X } from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import FoodCard from '../components/FoodCard';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { ListingSkeletons } from '../components/Skeletons';
import { FOOD_TYPE_LABELS, MEAL_LABELS } from '../utils/format';

const TYPES = [
  { value: '', label: 'Any food service' },
  ...Object.entries(FOOD_TYPE_LABELS).map(([value, label]) => ({ value, label }))
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' }
];

function parseFilters(params) {
  return {
    city: params.get('city') || '',
    area: params.get('area') || '',
    type: params.get('type') || '',
    foodType: params.get('foodType') || '',
    meal: params.get('meal') || '',
    minBudget: params.get('minBudget') || '',
    maxBudget: params.get('maxBudget') || ''
  };
}

export default function FoodPage() {
  usePageMeta('Food & Tiffin Services', 'Compare messes, tiffin services, home-cooked kitchens and monthly meal plans by menu, meals and price.');
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(() => parseFilters(params));
  const [keyword, setKeyword] = useState(params.get('q') || '');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [places, setPlaces] = useState({ cities: [], areas: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sort = params.get('sort') || 'newest';
  const queryString = params.toString();

  useEffect(() => {
    api.get('/meta/places').then(({ data }) => setPlaces(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setDraft(parseFilters(params));
    setKeyword(params.get('q') || '');
  }, [queryString]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/food?${queryString}`)
      .then(({ data }) => {
        if (!active) return;
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message);
        setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [queryString]);

  const areas = useMemo(() => {
    if (draft.city && places.areas?.[draft.city]) return places.areas[draft.city];
    return Object.values(places.areas || {}).flat().slice(0, 60);
  }, [draft.city, places.areas]);

  const update = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const applyFilters = (event) => {
    event.preventDefault();
    const next = new URLSearchParams();
    Object.entries(draft).forEach(([key, value]) => {
      if (value) next.set(key, value);
    });
    if (keyword.trim()) next.set('q', keyword.trim());
    if (sort !== 'newest') next.set('sort', sort);
    setParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraft(parseFilters(new URLSearchParams()));
    setKeyword('');
    setParams(new URLSearchParams());
    setFiltersOpen(false);
  };

  const changeSort = (event) => {
    const next = new URLSearchParams(params);
    if (event.target.value === 'newest') next.delete('sort');
    else next.set('sort', event.target.value);
    next.delete('page');
    setParams(next);
  };

  const changePage = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchKeyword = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (keyword.trim()) next.set('q', keyword.trim());
    else next.delete('q');
    next.delete('page');
    setParams(next);
  };

  const activeCount = Object.values(draft).filter(Boolean).length;

  return (
    <div className="page page-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <span>Food & tiffin</span>
        </nav>

        <div className="page-header">
          <div>
            <h1 className="display">Good food, close to home</h1>
            <p>
              Find messes, tiffin services, home kitchens and monthly meal plans. Compare monthly
              prices, included meals and menus before you commit.
            </p>
          </div>
          <Link to="/signup?role=food_provider" className="btn btn-outline">
            List your food service
          </Link>
        </div>

        <form className="search-toolbar" onSubmit={searchKeyword}>
          <div className="input-icon-wrap">
            <Search size={16} />
            <input
              className="input"
              placeholder="Search by kitchen, dish, city or area"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="Search food services"
            />
          </div>
          <button type="submit" className="btn btn-dark btn-sm">Search</button>
          <button type="button" className="btn btn-outline btn-sm mobile-filter-toggle" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={14} /> Filters {activeCount > 0 ? `(${activeCount})` : ''}
          </button>
        </form>

        <div className="filters-layout" style={{ marginTop: 24 }}>
          {filtersOpen && <div className="filters-backdrop" onClick={() => setFiltersOpen(false)} />}
          <aside className={`filters-sidebar ${filtersOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
              style={{ position: 'absolute', top: 14, right: 14, display: filtersOpen ? 'grid' : 'none' }}
            >
              <X size={16} />
            </button>
            <form onSubmit={applyFilters}>
              <div className="filters-head">
                <h3>Filters {activeCount > 0 ? `(${activeCount})` : ''}</h3>
                <button type="button" className="btn-link small" onClick={clearFilters}>Clear all</button>
              </div>
              <div className="filter-group">
                <label htmlFor="food-city">City</label>
                <select id="food-city" className="select" value={draft.city} onChange={update('city')}>
                  <option value="">All cities</option>
                  {places.cities.map((city) => (
                    <option value={city} key={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="food-area">Area</label>
                <input id="food-area" className="input" list="food-areas" placeholder="e.g. Indiranagar" value={draft.area} onChange={update('area')} />
                <datalist id="food-areas">
                  {areas.map((area) => <option value={area} key={area} />)}
                </datalist>
              </div>
              <div className="filter-group">
                <label htmlFor="food-type">Service type</label>
                <select id="food-type" className="select" value={draft.type} onChange={update('type')}>
                  {TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="food-preference">Food preference</label>
                <select id="food-preference" className="select" value={draft.foodType} onChange={update('foodType')}>
                  <option value="">Any</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non_veg">Non-vegetarian</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="food-meal">Meal included</label>
                <select id="food-meal" className="select" value={draft.meal} onChange={update('meal')}>
                  <option value="">Any meal</option>
                  {Object.entries(MEAL_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <span className="filter-group-title">Monthly price</span>
                <div className="budget-row">
                  <input className="input" type="number" min="0" placeholder="Min" aria-label="Minimum monthly price" value={draft.minBudget} onChange={update('minBudget')} />
                  <span>to</span>
                  <input className="input" type="number" min="0" placeholder="Max" aria-label="Maximum monthly price" value={draft.maxBudget} onChange={update('maxBudget')} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 6 }}>Apply filters</button>
            </form>
          </aside>

          <div>
            <div className="results-head">
              <p className="results-count">
                {loading ? 'Searching…' : (
                  <>
                    <strong>{pagination?.total || 0}</strong> food service{pagination?.total === 1 ? '' : 's'} found
                  </>
                )}
              </p>
              <select className="select" value={sort} onChange={changeSort} aria-label="Sort food services" style={{ width: 'auto', padding: '8px 34px 8px 12px', fontSize: '0.82rem' }}>
                {SORTS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </div>

            {error && (
              <div className="error-state">
                <h3>Could not load food services</h3>
                <p>{error}</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}

            {!error && loading && <ListingSkeletons count={6} />}

            {!error && !loading && items.length > 0 && (
              <>
                <div className="listing-grid two">
                  {items.map((food) => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      onSavedChange={(saved) =>
                        setItems((current) =>
                          current.map((item) => (item.id === food.id ? { ...item, isSaved: saved } : item))
                        )
                      }
                    />
                  ))}
                </div>
                <Pagination pagination={pagination} onChange={changePage} />
              </>
            )}

            {!error && !loading && items.length === 0 && (
              <EmptyState
                icon={UtensilsCrossed}
                title="No food services match those filters"
                description="Try another locality, allowing more meal types, or widening your monthly budget."
                actionLabel="Clear filters"
                onAction={clearFilters}
              >
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setFiltersOpen(true)}>
                  Adjust filters
                </button>
              </EmptyState>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
