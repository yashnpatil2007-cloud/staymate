import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, ChevronRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import PropertyCard from '../components/PropertyCard';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { ListingSkeletons } from '../components/Skeletons';
import { AMENITY_LABELS, PROPERTY_TYPE_LABELS } from '../utils/format';

const TYPES = [
  { value: '', label: 'Any type' },
  ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label }))
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Rent: low to high' },
  { value: 'price_desc', label: 'Rent: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popular', label: 'Most viewed' }
];

const AMENITIES = ['wifi', 'ac', 'food', 'laundry', 'parking', 'attached_bathroom', 'power_backup', 'security', 'gym', 'housekeeping'];

function parseFilters(params) {
  return {
    q: params.get('q') || '',
    city: params.get('city') || '',
    area: params.get('area') || '',
    type: params.get('type') || '',
    minBudget: params.get('minBudget') || '',
    maxBudget: params.get('maxBudget') || '',
    gender: params.get('gender') || '',
    furnishing: params.get('furnishing') || '',
    beds: params.get('beds') || '',
    college: params.get('college') || '',
    workplace: params.get('workplace') || '',
    amenities: params.getAll('amenity')
  };
}

export default function AccommodationsPage() {
  usePageMeta('Find Accommodation', 'Search hostels, PGs, rooms, flats and apartments with real filters for rent, amenities and availability.');
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(() => parseFilters(params));
  const [keyword, setKeyword] = useState(params.get('q') || '');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [places, setPlaces] = useState({ cities: [], areas: {} });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    api
      .get('/meta/places')
      .then(({ data }) => setPlaces(data))
      .catch(() => setPlaces({ cities: [], areas: {} }));
  }, []);

  const queryString = params.toString();

  useEffect(() => {
    setDraft(parseFilters(params));
    setKeyword(params.get('q') || '');
  }, [queryString]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/properties?${queryString}`);
        if (!active) return;
        setItems(data.items);
        setPagination(data.pagination);
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
          setItems([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [queryString]);

  const areas = useMemo(() => {
    if (draft.city && places.areas?.[draft.city]) return places.areas[draft.city];
    return Object.values(places.areas || {}).flat().slice(0, 60);
  }, [draft.city, places.areas]);

  const update = (field) => (event) => setDraft({ ...draft, [field]: event.target.value });

  const toggleAmenity = (amenity) => {
    setDraft((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity]
    }));
  };

  const applyFilters = (event) => {
    event?.preventDefault();
    const next = new URLSearchParams();
    const mapping = ['city', 'area', 'type', 'minBudget', 'maxBudget', 'gender', 'furnishing', 'beds', 'college', 'workplace'];
    mapping.forEach((key) => {
      const value = draft[key];
      if (value) next.set(key, value);
    });
    if (keyword.trim()) next.set('q', keyword.trim());
    draft.amenities.forEach((amenity) => next.append('amenity', amenity));
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

  const activeCount = draft.amenities.length + ['city', 'area', 'type', 'minBudget', 'maxBudget', 'gender', 'furnishing', 'beds', 'college', 'workplace'].filter((key) => draft[key]).length;

  const filterForm = (
    <form onSubmit={applyFilters}>
      <div className="filters-head">
        <h3>Filters {activeCount > 0 ? `(${activeCount})` : ''}</h3>
        <button type="button" className="btn-link small" onClick={clearFilters}>
          Clear all
        </button>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-city">City</label>
        <select id="filter-city" className="select" value={draft.city} onChange={update('city')}>
          <option value="">All cities</option>
          {places.cities.map((city) => (
            <option value={city} key={city}>{city}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-area">Area or locality</label>
        <input
          id="filter-area"
          className="input"
          list="accommodation-areas"
          placeholder="e.g. Koramangala"
          value={draft.area}
          onChange={update('area')}
        />
        <datalist id="accommodation-areas">
          {areas.map((area) => (
            <option value={area} key={area} />
          ))}
        </datalist>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-type">Accommodation type</label>
        <select id="filter-type" className="select" value={draft.type} onChange={update('type')}>
          {TYPES.map((type) => (
            <option value={type.value} key={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-group-title">Monthly rent</span>
        <div className="budget-row">
          <input
            className="input"
            type="number"
            min="0"
            placeholder="Min"
            aria-label="Minimum rent"
            value={draft.minBudget}
            onChange={update('minBudget')}
          />
          <span>to</span>
          <input
            className="input"
            type="number"
            min="0"
            placeholder="Max"
            aria-label="Maximum rent"
            value={draft.maxBudget}
            onChange={update('maxBudget')}
          />
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-gender">Gender preference</label>
        <select id="filter-gender" className="select" value={draft.gender} onChange={update('gender')}>
          <option value="">Any</option>
          <option value="male">Male-friendly</option>
          <option value="female">Female-friendly</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-furnishing">Furnishing</label>
        <select id="filter-furnishing" className="select" value={draft.furnishing} onChange={update('furnishing')}>
          <option value="">Any</option>
          <option value="furnished">Furnished</option>
          <option value="semi_furnished">Semi-furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-beds">Available beds</label>
        <select id="filter-beds" className="select" value={draft.beds} onChange={update('beds')}>
          <option value="">Any</option>
          <option value="1">1 or more</option>
          <option value="2">2 or more</option>
          <option value="3">3 or more</option>
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-group-title">Amenities</span>
        <div className="filter-check-list">
          {AMENITIES.map((amenity) => (
            <label className="filter-check" key={amenity}>
              <input
                type="checkbox"
                checked={draft.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              {AMENITY_LABELS[amenity]}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-group-title">Nearby</span>
        <div className="stack-sm">
          <input
            className="input"
            placeholder="College name"
            aria-label="College nearby"
            value={draft.college}
            onChange={update('college')}
          />
          <input
            className="input"
            placeholder="Workplace name"
            aria-label="Workplace nearby"
            value={draft.workplace}
            onChange={update('workplace')}
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 6 }}>
        Apply filters
      </button>
    </form>
  );

  return (
    <div className="page page-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <span>Find accommodation</span>
        </nav>

        <div className="page-header">
          <div>
            <h1 className="display">Find accommodation that fits</h1>
            <p>
              Compare live hostels, PGs, rooms, flats and apartments. Filter by rent, locality,
              amenities and availability — every result comes from the StayMate database.
            </p>
          </div>
          <Link to="/roommates" className="btn btn-outline">
            Looking for a roommate instead?
          </Link>
        </div>

        <form className="search-toolbar" onSubmit={searchKeyword}>
          <div className="input-icon-wrap">
            <Search size={16} />
            <input
              className="input"
              placeholder="Search by property name, city or area"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="Search accommodation"
            />
          </div>
          <button type="submit" className="btn btn-dark btn-sm">Search</button>
          <button
            type="button"
            className="btn btn-outline btn-sm mobile-filter-toggle"
            onClick={() => setFiltersOpen(true)}
          >
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
            {filterForm}
          </aside>

          <div>
            <div className="results-head">
              <p className="results-count">
                {loading ? 'Searching…' : (
                  <>
                    <strong>{pagination?.total || 0}</strong> accommodation
                    {pagination?.total === 1 ? '' : 's'} found
                  </>
                )}
              </p>
              <div className="row">
                <Filter size={14} className="muted" />
                <select className="select" value={sort} onChange={changeSort} aria-label="Sort results" style={{ width: 'auto', padding: '8px 34px 8px 12px', fontSize: '0.82rem' }}>
                  {SORTS.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="error-state">
                <h3>Could not load accommodation</h3>
                <p>{error}</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            )}

            {!error && loading && <ListingSkeletons count={6} />}

            {!error && !loading && items.length > 0 && (
              <>
                <div className="listing-grid two">
                  {items.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onSavedChange={(saved) =>
                        setItems((current) =>
                          current.map((item) => (item.id === property.id ? { ...item, isSaved: saved } : item))
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
                icon={Building2}
                title="No stays match those filters"
                description="Try widening your budget, choosing another locality, or removing a few amenity filters."
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
