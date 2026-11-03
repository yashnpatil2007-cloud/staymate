import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Clock3,
  CreditCard,
  HeartHandshake,
  MapPin,
  MessageSquare,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wallet,
  Users
} from 'lucide-react';
import api, { resolveImage } from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import PropertyCard, { CardImage } from '../components/PropertyCard';
import FoodCard from '../components/FoodCard';
import RatingStars from '../components/RatingStars';
import Avatar from '../components/Avatar';
import { ListingSkeletons } from '../components/Skeletons';
import { formatCurrency, formatDate } from '../utils/format';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80';
const FALLBACK_ACCENT =
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80';

const BUDGETS = [
  { value: '', label: 'Any budget' },
  { value: '5000', label: 'Under ₹5,000' },
  { value: '8000', label: 'Under ₹8,000' },
  { value: '12000', label: 'Under ₹12,000' },
  { value: '20000', label: 'Under ₹20,000' },
  { value: '35000', label: 'Under ₹35,000' }
];

const TYPES = [
  { value: '', label: 'Any type' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'pg', label: 'PG' },
  { value: 'single_room', label: 'Single room' },
  { value: 'shared_room', label: 'Shared room' },
  { value: 'flat', label: 'Flat' },
  { value: 'apartment', label: 'Apartment' }
];

const SCORE_POINTS = [
  { icon: Wallet, label: 'Budget overlap', value: '25 pts' },
  { icon: MapPin, label: 'City & locality', value: '20 pts' },
  { icon: Moon, label: 'Sleep schedule', value: '10 pts' },
  { icon: HeartHandshake, label: 'Shared lifestyle', value: '10 pts' }
];

const FAQS = [
  {
    q: 'Is StayMate free for customers?',
    a: 'Yes. Browsing accommodation, roommate profiles and food services is free. StayMate does not require any payment to search or send an enquiry today.'
  },
  {
    q: 'How are property and food listings reviewed?',
    a: 'Every new property listing and food service is submitted for administrator review before it appears publicly. Owners and providers can see the approval status in their dashboard.'
  },
  {
    q: 'How does roommate compatibility work?',
    a: 'The score is calculated from your saved roommate profile and the other person’s profile. It weighs budget overlap, city and locality, accommodation type, food preference, sleep schedule, smoking, cleanliness and shared lifestyle interests. It is deterministic — never a random number.'
  },
  {
    q: 'Are the reviews genuine?',
    a: 'Reviews require a verified interaction. A customer can review a listing only after the provider marks their enquiry as contacted, and each customer can review a listing once. StayMate does not create or seed reviews.'
  },
  {
    q: 'How do I contact an owner or food provider?',
    a: 'Open a listing and use the contact form. Your enquiry and contact details are shared with that specific provider, who can respond through their dashboard or the phone number you provide.'
  },
  {
    q: 'Can I list my property or tiffin service without paying?',
    a: 'Yes. Creating an owner or food provider account and submitting a listing is free. Paid promotions and subscriptions are not enabled, and no payment functionality is simulated.'
  }
];

export default function HomePage() {
  usePageMeta(
    'Find Your Stay. Find Your People.',
    'StayMate helps students and working professionals find hostels, PGs, rental rooms, compatible roommates and reliable mess or tiffin services.'
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const [home, setHome] = useState({ featured: [], stats: { properties: 0, foodProviders: 0, cities: 0 } });
  const [cities, setCities] = useState([]);
  const [food, setFood] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState({ city: '', type: '', maxBudget: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [homeRes, cityRes, foodRes, testimonialRes] = await Promise.all([
          api.get('/properties/home'),
          api.get('/properties/cities'),
          api.get('/food?limit=3&sort=rating'),
          api.get('/meta/testimonials')
        ]);
        if (!active) return;
        setHome(homeRes.data);
        setCities(cityRes.data.cities);
        setFood(foodRes.data.items);
        setTestimonials(testimonialRes.data.items);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const heroImages = useMemo(() => {
    const first = home.featured?.[0]?.images?.[0];
    const second = home.featured?.[1]?.images?.[0];
    return {
      main: first ? resolveImage(first) : FALLBACK_HERO,
      accent: second ? resolveImage(second) : FALLBACK_ACCENT
    };
  }, [home.featured]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.city.trim()) params.set('city', search.city.trim());
    if (search.type) params.set('type', search.type);
    if (search.maxBudget) params.set('maxBudget', search.maxBudget);
    navigate(`/accommodations?${params.toString()}`);
  };


  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">
              <span className="pill">New city?</span>
              Stay. People. Food. One platform.
            </span>
            <h1 className="display">
              Find your perfect stay. <em>Live better.</em>
            </h1>
            <p className="hero-desc">
              Discover affordable accommodation, compatible roommates, and reliable food services —
              all in one place.
            </p>

            <form className="hero-search" onSubmit={submitSearch}>
              <div className="hero-search-fields">
                <div className="field">
                  <label htmlFor="hero-city">Where are you moving?</label>
                  <div className="input-icon-wrap">
                    <MapPin size={16} />
                    <input
                      id="hero-city"
                      className="input"
                      list="home-cities"
                      placeholder="City or locality"
                      value={search.city}
                      onChange={(event) => setSearch({ ...search, city: event.target.value })}
                    />
                    <datalist id="home-cities">
                      {cities.map((city) => (
                        <option value={city.city} key={city.city} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="hero-type">Accommodation</label>
                  <select
                    id="hero-type"
                    className="select"
                    value={search.type}
                    onChange={(event) => setSearch({ ...search, type: event.target.value })}
                  >
                    {TYPES.map((type) => (
                      <option value={type.value} key={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="hero-budget">Monthly budget</label>
                  <select
                    id="hero-budget"
                    className="select"
                    value={search.maxBudget}
                    onChange={(event) => setSearch({ ...search, maxBudget: event.target.value })}
                  >
                    {BUDGETS.map((budget) => (
                      <option value={budget.value} key={budget.value}>
                        {budget.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
                  <Search size={16} /> Search
                </button>
              </div>
              <p className="hero-search-note">
                <ShieldCheck size={13} /> Listings are moderated before going live. No booking
                payment required.
              </p>
            </form>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{home.stats.properties || '—'}</strong>
                <span>Live accommodations</span>
              </div>
              <span className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>{home.stats.foodProviders || '—'}</strong>
                <span>Food services</span>
              </div>
              <span className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>{home.stats.cities || '—'}</strong>
                <span>Cities covered</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-image-main">
              <img src={heroImages.main} alt="" />
            </div>
            <div className="hero-image-accent">
              <img src={heroImages.accent} alt="" />
            </div>
            <div className="hero-float-badge">
              <BadgeCheck size={15} /> Moderated listings
            </div>
            <div className="hero-float-card">
              <span className="hero-float-icon">
                <Users size={19} />
              </span>
              <div>
                <p>Roommates matched on real preferences</p>
                <span>Budget · locality · lifestyle</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {cities.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div className="section-head-copy">
                <span className="eyebrow">Popular cities</span>
                <h2 className="display">Cities where StayMate is finding homes</h2>
                <p>Start with a city, then narrow down by area, budget and the amenities you need.</p>
              </div>
              <Link to="/accommodations" className="link-arrow">
                Explore all stays <ArrowRight size={15} />
              </Link>
            </div>
            <div className="city-grid">
              {cities.slice(0, 4).map((city) => (
                <Link
                  to={`/accommodations?city=${encodeURIComponent(city.city)}`}
                  className="city-card"
                  key={city.city}
                >
                  <CardImage src={city.image} alt={`Accommodation in ${city.city}`} />
                  <div className="city-card-content">
                    <h3>{city.city}</h3>
                    <p>
                      {city.count} stay{city.count === 1 ? '' : 's'}
                      {city.foodCount ? ` · ${city.foodCount} food services` : ''}
                    </p>
                    {city.minRent !== undefined && city.minRent !== null && (
                      <span className="from">From {formatCurrency(city.minRent)}/month</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-head-copy">
              <span className="eyebrow">Featured stays</span>
              <h2 className="display">A place that already feels sorted</h2>
              <p>
                Handpicked from live listings across hostels, PGs, rooms, flats and apartments.
                Demo content is always labelled.
              </p>
            </div>
            <Link to="/accommodations" className="link-arrow">
              View all accommodation <ArrowRight size={15} />
            </Link>
          </div>
          {error && (
            <div className="error-state">
              <h3>We could not load live listings</h3>
              <p>{error}</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}
          {!error && loading && <ListingSkeletons count={3} />}
          {!error && !loading && (
            <div className="listing-grid">
              {home.featured.slice(0, 6).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSavedChange={(saved) => {
                    setHome((current) => ({
                      ...current,
                      featured: current.featured.map((item) =>
                        item.id === property.id ? { ...item, isSaved: saved } : item
                      )
                    }));
                  }}
                />
              ))}
            </div>
          )}
          {!error && !loading && home.featured.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <Building2 size={24} />
              </span>
              <h3>No approved listings yet</h3>
              <p>New listings appear here after moderator approval. Check back soon or list your property.</p>
              <Link to="/list-your-property" className="btn btn-primary btn-sm">
                List your property
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="roommate-band">
            <div>
              <span className="eyebrow">Find your people</span>
              <h2 className="display">Your ideal roommate is not just a filter.</h2>
              <p>
                Create a roommate profile with your budget, preferred locality, schedule and habits.
                StayMate compares it with other profiles and explains exactly why a match scores well.
              </p>
              <div className="roommate-band-points">
                <div>
                  <Check size={15} /> Transparent compatibility score
                </div>
                <div>
                  <Check size={15} /> Private until you connect
                </div>
                <div>
                  <Check size={15} /> Send and manage requests
                </div>
                <div>
                  <Check size={15} /> No random matches
                </div>
              </div>
              <div className="roommate-band-actions">
                <Link to="/roommates" className="btn btn-primary">
                  Find roommates <ArrowRight size={15} />
                </Link>
                <Link to={user ? '/roommates/profile' : '/signup'} className="btn btn-light">
                  {user ? 'Edit my roommate profile' : 'Create a profile'}
                </Link>
              </div>
            </div>
            <div className="compat-preview" aria-label="How compatibility is scored">
              <div className="compat-preview-card">
                <span className="compat-preview-avatar">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h4>Explainable matching</h4>
                  <p>Every point maps to a real preference</p>
                </div>
                <span className="compat-preview-score">100 max</span>
              </div>
              {SCORE_POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <div className="compat-preview-card" key={point.label}>
                    <span className="compat-preview-avatar">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h4>{point.label}</h4>
                      <p>Weighted in the score</p>
                    </div>
                    <span className="compat-preview-score">{point.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="section-head-copy">
              <span className="eyebrow">Food & tiffin</span>
              <h2 className="display">Meals that make a new city easier</h2>
              <p>
                Compare messes, tiffin services, home-cooked kitchens and daily meal plans by menu,
                meals and monthly price.
              </p>
            </div>
            <Link to="/food" className="link-arrow">
              Explore food services <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <ListingSkeletons count={3} />
          ) : food.length > 0 ? (
            <div className="listing-grid">
              {food.map((item) => (
                <FoodCard key={item.id} food={item} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <UtensilsCrossed size={24} />
              </span>
              <h3>Food listings are on the way</h3>
              <p>Approved mess and tiffin services will appear here. Are you a food provider?</p>
              <Link to="/signup?role=food_provider" className="btn btn-primary btn-sm">
                List your food service
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head center">
            <div className="section-head-copy">
              <span className="eyebrow">How it works</span>
              <h2 className="display">Three steps to feeling settled</h2>
              <p>No endless group chats. No guesswork. Just the information you need to decide.</p>
            </div>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: Search,
                title: 'Tell us what you need',
                text: 'Search by city, area, budget and accommodation type. Filter for the amenities that actually matter to you — Wi-Fi, food, AC, parking and more.'
              },
              {
                icon: MessageSquare,
                title: 'Compare and contact',
                text: 'Open full listings with real photos, rent, deposit, house rules and availability. Send an enquiry that goes directly to the owner or provider.'
              },
              {
                icon: HeartHandshake,
                title: 'Settle in with the right people',
                text: 'Match with compatible roommates, save your shortlist and keep every request, reply and notification in one dashboard.'
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="step-card" key={step.title}>
                  <span className="step-number">0{index + 1}</span>
                  <span className="step-icon">
                    <Icon size={20} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="section-head-copy">
              <span className="eyebrow">Why StayMate</span>
              <h2 className="display">Built for the week before you move</h2>
              <p>The practical details that usually live across five apps and ten WhatsApp groups.</p>
            </div>
          </div>
          <div className="why-grid">
            {[
              {
                icon: ShieldCheck,
                title: 'Moderated listings',
                text: 'New property and food listings are reviewed by an administrator before going live. Status is visible to owners and providers.'
              },
              {
                icon: Wallet,
                title: 'Transparent pricing',
                text: 'Monthly rent, deposit and meal prices are shown up front. No invented “starting from” prices.'
              },
              {
                icon: Users,
                title: 'Compatibility, explained',
                text: 'Roommate scores come from your actual budgets, schedule and lifestyle preferences — with a visible breakdown.'
              },
              {
                icon: Star,
                title: 'Community reviews',
                text: 'Transparent ratings and reviews from verified students, working professionals, and residents.'
              },
              {
                icon: Clock3,
                title: 'One dashboard',
                text: 'Saved stays, roommate requests, enquiries, notifications and listings stay in one organised workspace.'
              },
              {
                icon: CreditCard,
                title: 'No compulsory payments',
                text: 'Browsing and contacting providers is free. Paid promotions and subscriptions are not enabled yet.'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="why-card" key={item.title}>
                  <span className="why-icon">
                    <Icon size={19} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-head-copy">
              <span className="eyebrow">Real Experiences</span>
              <h2 className="display">What students & professionals are saying</h2>
              <p>
                Authentic reviews from students, employees, and residents sharing genuine feedback on
                hostels, PGs, flats, and mess services.
              </p>
            </div>
          </div>
          {testimonials.length > 0 ? (
            <div className="testimonial-grid">
              {testimonials.slice(0, 3).map((testimonial) => {
                const reviewerRoleLabel =
                  testimonial.reviewerType === 'student'
                    ? '🎓 Student'
                    : testimonial.reviewerType === 'working_professional'
                    ? '💼 Working Professional'
                    : '🏠 Resident';

                return (
                  <article className="testimonial-card" key={testimonial.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <RatingStars value={testimonial.rating} />
                      <span className={`reviewer-badge ${testimonial.reviewerType || 'resident'}`}>
                        {reviewerRoleLabel}
                      </span>
                    </div>
                    <p className="testimonial-quote">“{testimonial.comment}”</p>
                    <div className="testimonial-user">
                      <Avatar src={testimonial.user?.avatar} name={testimonial.user?.name} size="sm" />
                      <div>
                        <h4>{testimonial.user?.name || 'StayMate customer'}</h4>
                        <p>
                          {testimonial.listing?.name ? (
                            <Link to={testimonial.listing.link} className="btn-link" style={{ fontWeight: 600 }}>
                              {testimonial.listing.name}
                            </Link>
                          ) : (
                            'Verified review'
                          )}
                          {testimonial.createdAt ? ` · ${formatDate(testimonial.createdAt)}` : ''}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="testimonial-empty">
              <span className="empty-icon">
                <MessageSquare size={23} />
              </span>
              <h3>No public reviews yet</h3>
              <p>
                Be among the first to review accommodation or food services on StayMate.
              </p>
              <Link to="/accommodations" className="btn btn-outline btn-sm">
                Browse accommodation
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="owner-cta">
            <div className="owner-cta-content">
              <span className="eyebrow">For owners & providers</span>
              <h2 className="display">Your empty room or kitchen has a customer.</h2>
              <p>
                List hostels, PGs, rooms, flats or meal services. Manage enquiries, update
                availability and track approval — from one dashboard, without listing fees.
              </p>
              <div className="owner-cta-stats">
                <div>
                  <strong>Free</strong>
                  <span>to list</span>
                </div>
                <div>
                  <strong>Moderated</strong>
                  <span>quality</span>
                </div>
                <div>
                  <strong>Direct</strong>
                  <span>customer enquiries</span>
                </div>
              </div>
              <div className="owner-cta-actions">
                <Link to="/list-your-property" className="btn btn-primary">
                  <Plus size={16} /> List your property
                </Link>
                <Link to="/signup?role=food_provider" className="btn btn-light">
                  List food service
                </Link>
              </div>
            </div>
            <div className="owner-cta-visual">
              <img src={heroImages.main} alt="" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="faq">
        <div className="container">
          <div className="section-head center">
            <div className="section-head-copy">
              <span className="eyebrow">Questions</span>
              <h2 className="display">Before you pack your bags</h2>
            </div>
          </div>
          <div className="faq-list">
            {FAQS.map((faq) => (
              <details className="faq-item" key={faq.q}>
                <summary>
                  {faq.q}
                  <Plus size={18} />
                </summary>
                <p className="faq-answer">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
