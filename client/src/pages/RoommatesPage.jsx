import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Pencil,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { useToast } from '../context/ToastContext';
import RoommateCard from '../components/RoommateCard';
import RoommateRequestModal from '../components/RoommateRequestModal';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { RoommateSkeletons } from '../components/Skeletons';
import {
  FOOD_PREFERENCE_LABELS,
  GENDER_LABELS,
  OCCUPATION_LABELS,
  SLEEP_LABELS,
  formatCurrency
} from '../utils/format';

function parseFilters(params) {
  return {
    city: params.get('city') || '',
    locality: params.get('locality') || '',
    budgetMin: params.get('budgetMin') || '',
    budgetMax: params.get('budgetMax') || '',
    occupation: params.get('occupation') || '',
    gender: params.get('gender') || '',
    foodPreference: params.get('foodPreference') || '',
    sleepSchedule: params.get('sleepSchedule') || '',
    minCompatibility: params.get('minCompatibility') || ''
  };
}

export default function RoommatesPage() {
  usePageMeta('Find a Roommate', 'Find compatible roommates using transparent budget, locality, schedule and lifestyle matching.');
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(() => parseFilters(params));
  const [keyword, setKeyword] = useState(params.get('q') || '');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [viewerHasProfile, setViewerHasProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [places, setPlaces] = useState({ cities: [], areas: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [requestingId, setRequestingId] = useState(null);
  const queryString = params.toString();

  useEffect(() => {
    api.get('/meta/places').then(({ data }) => setPlaces(data)).catch(() => {});
    api
      .get('/roommates/profile/me')
      .then(({ data }) => {
        setViewerHasProfile(Boolean(data.profile));
        setMyProfile(data.profile);
      })
      .catch(() => setViewerHasProfile(false));
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
      .get(`/roommates?${queryString}`)
      .then(({ data }) => {
        if (!active) return;
        setItems(data.items);
        setPagination(data.pagination);
        setViewerHasProfile(data.viewerHasProfile);
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
    setParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraft(parseFilters(new URLSearchParams()));
    setKeyword('');
    setParams(new URLSearchParams());
    setFiltersOpen(false);
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

  const openRequest = (profile) => {
    if (!viewerHasProfile) {
      toast.info('Create your roommate profile before sending a request.');
      navigate('/roommates/profile');
      return;
    }
    setTarget(profile);
  };

  const activeCount = Object.values(draft).filter(Boolean).length;

  return (
    <div className="page page-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <span>Find a roommate</span>
        </nav>

        <div className="page-header">
          <div>
            <h1 className="display">Find someone who fits</h1>
            <p>
              Compatibility is calculated from both profiles — budget overlap, city and locality,
              accommodation type, food, sleep schedule, smoking, cleanliness and lifestyle.
            </p>
          </div>
          <Link to="/roommates/profile" className="btn btn-primary">
            {viewerHasProfile ? <><Pencil size={15} /> Edit my profile</> : <><UserPlus size={15} /> Create my profile</>}
          </Link>
        </div>

        {viewerHasProfile === false && (
          <div className="profile-nudge">
            <span className="empty-icon"><Sparkles size={22} /></span>
            <div>
              <h3>Unlock compatibility scores</h3>
              <p>
                Add your budget, locality, schedule and habits to see how you match with every
                profile. Your contact details stay private until you accept a request.
              </p>
            </div>
            <Link to="/roommates/profile" className="btn btn-primary btn-sm">Create profile</Link>
          </div>
        )}

        {viewerHasProfile && myProfile && (
          <div className="profile-nudge is-ready">
            <span className="empty-icon"><Users size={22} /></span>
            <div>
              <h3>Your profile is live</h3>
              <p>
                {myProfile.city}{myProfile.locality ? ` · ${myProfile.locality}` : ''} ·{' '}
                {formatCurrency(myProfile.budgetMin)}–{formatCurrency(myProfile.budgetMax)} ·{' '}
                {OCCUPATION_LABELS[myProfile.occupation] || myProfile.occupation}
              </p>
            </div>
            <Link to="/roommates/profile" className="btn btn-outline btn-sm">
              Update profile <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <form className="search-toolbar" onSubmit={searchKeyword}>
          <div className="input-icon-wrap">
            <Search size={16} />
            <input
              className="input"
              placeholder="Search by locality, college, company or bio"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="Search roommates"
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
                <label htmlFor="rm-city">City</label>
                <select id="rm-city" className="select" value={draft.city} onChange={update('city')}>
                  <option value="">All cities</option>
                  {places.cities.map((city) => <option value={city} key={city}>{city}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="rm-locality">Locality</label>
                <input id="rm-locality" className="input" list="roommate-areas" value={draft.locality} onChange={update('locality')} placeholder="e.g. Koramangala" />
                <datalist id="roommate-areas">
                  {areas.map((area) => <option value={area} key={area} />)}
                </datalist>
              </div>
              <div className="filter-group">
                <span className="filter-group-title">Budget range</span>
                <div className="budget-row">
                  <input className="input" type="number" min="0" placeholder="Min" aria-label="Minimum budget" value={draft.budgetMin} onChange={update('budgetMin')} />
                  <span>to</span>
                  <input className="input" type="number" min="0" placeholder="Max" aria-label="Maximum budget" value={draft.budgetMax} onChange={update('budgetMax')} />
                </div>
              </div>
              <div className="filter-group">
                <label htmlFor="rm-occupation">Occupation</label>
                <select id="rm-occupation" className="select" value={draft.occupation} onChange={update('occupation')}>
                  <option value="">Any</option>
                  <option value="student">Student</option>
                  <option value="working_professional">Working professional</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="rm-gender">Gender</label>
                <select id="rm-gender" className="select" value={draft.gender} onChange={update('gender')}>
                  <option value="">Any</option>
                  {Object.entries(GENDER_LABELS).filter(([value]) => value !== 'any').map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="rm-food">Food preference</label>
                <select id="rm-food" className="select" value={draft.foodPreference} onChange={update('foodPreference')}>
                  <option value="">Any</option>
                  {Object.entries(FOOD_PREFERENCE_LABELS).filter(([value]) => value !== 'both').map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="rm-sleep">Sleep schedule</label>
                <select id="rm-sleep" className="select" value={draft.sleepSchedule} onChange={update('sleepSchedule')}>
                  <option value="">Any</option>
                  {Object.entries(SLEEP_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="rm-compatibility">Minimum compatibility</label>
                <select id="rm-compatibility" className="select" value={draft.minCompatibility} onChange={update('minCompatibility')} disabled={!viewerHasProfile}>
                  <option value="">Any score</option>
                  <option value="40">40% and above</option>
                  <option value="60">60% and above</option>
                  <option value="80">80% and above</option>
                </select>
                {!viewerHasProfile && <span className="field-hint">Create a profile to filter by compatibility.</span>}
              </div>
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 6 }}>Apply filters</button>
            </form>
          </aside>

          <div>
            <div className="results-head">
              <p className="results-count">
                {loading ? 'Finding matches…' : (
                  <>
                    <strong>{pagination?.total || 0}</strong> roommate profile{pagination?.total === 1 ? '' : 's'}
                    {viewerHasProfile ? ' · sorted by compatibility' : ''}
                  </>
                )}
              </p>
              <span className="badge badge-teal"><Sparkles size={12} /> Explainable matching</span>
            </div>

            {error && (
              <div className="error-state">
                <h3>Could not load roommate profiles</h3>
                <p>{error}</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}

            {!error && loading && <RoommateSkeletons count={6} />}

            {!error && !loading && items.length > 0 && (
              <>
                <div className="roommate-grid">
                  {items.map((profile) => (
                    <RoommateCard
                      key={profile.id}
                      profile={profile}
                      requestPending={profile.requestPending}
                      requesting={requestingId === profile.id}
                      onSend={openRequest}
                    />
                  ))}
                </div>
                <Pagination pagination={pagination} onChange={changePage} />
              </>
            )}

            {!error && !loading && items.length === 0 && (
              <EmptyState
                icon={Users}
                title="No roommate profiles match yet"
                description="Try widening your budget or removing a filter. New profiles appear as members create them."
                actionLabel="Clear filters"
                onAction={clearFilters}
              >
                <Link to="/roommates/profile" className="btn btn-primary btn-sm">Create your profile</Link>
              </EmptyState>
            )}
          </div>
        </div>
      </div>

      {target && (
        <RoommateRequestModal
          profile={target}
          onClose={() => {
            setTarget(null);
            setRequestingId(null);
          }}
          onSent={() => {
            setItems((current) =>
              current.map((item) =>
                item.id === target.id ? { ...item, requestPending: true } : item
              )
            );
            setRequestingId(null);
          }}
        />
      )}
    </div>
  );
}
