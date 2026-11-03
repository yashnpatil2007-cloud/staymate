import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Eye, EyeOff, Save, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { useToast } from '../context/ToastContext';
import { PageLoading } from '../components/Skeletons';
import {
  CLEANLINESS_LABELS,
  FOOD_PREFERENCE_LABELS,
  GENDER_LABELS,
  LIFESTYLE_LABELS,
  OCCUPATION_LABELS,
  SLEEP_LABELS,
  SMOKING_LABELS
} from '../utils/format';

const EMPTY = {
  age: '',
  gender: '',
  city: '',
  locality: '',
  budgetMin: '',
  budgetMax: '',
  occupation: '',
  collegeOrCompany: '',
  accommodationType: '',
  foodPreference: '',
  sleepSchedule: '',
  smoking: '',
  cleanliness: '',
  lifestyle: [],
  preferredGender: 'any',
  bio: '',
  isVisible: true
};

export default function RoommateProfilePage() {
  usePageMeta('My Roommate Profile', 'Create or update the roommate profile used for StayMate compatibility matching.');
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [places, setPlaces] = useState({ cities: [], areas: {} });
  const [existed, setExisted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/roommates/profile/me'),
      api.get('/meta/places').catch(() => ({ data: { cities: [], areas: {} } }))
    ])
      .then(([profileRes, placesRes]) => {
        setPlaces(placesRes.data);
        if (profileRes.data.profile) {
          const profile = profileRes.data.profile;
          setExisted(true);
          setForm({
            age: profile.age ?? '',
            gender: profile.gender || '',
            city: profile.city || '',
            locality: profile.locality || '',
            budgetMin: profile.budgetMin ?? '',
            budgetMax: profile.budgetMax ?? '',
            occupation: profile.occupation || '',
            collegeOrCompany: profile.collegeOrCompany || '',
            accommodationType: profile.accommodationType || '',
            foodPreference: profile.foodPreference || '',
            sleepSchedule: profile.sleepSchedule || '',
            smoking: profile.smoking || '',
            cleanliness: profile.cleanliness || '',
            lifestyle: profile.lifestyle || [],
            preferredGender: profile.preferredGender || 'any',
            bio: profile.bio || '',
            isVisible: profile.isVisible !== false
          });
        }
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const toggleLifestyle = (item) => {
    setForm((current) => ({
      ...current,
      lifestyle: current.lifestyle.includes(item)
        ? current.lifestyle.filter((value) => value !== item)
        : [...current.lifestyle, item]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (Number(form.budgetMax) < Number(form.budgetMin)) {
      setError('Maximum budget must be greater than or equal to the minimum budget.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/roommates/profile/me', {
        ...form,
        age: Number(form.age),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax)
      });
      toast.success(existed ? 'Roommate profile updated.' : 'Roommate profile created.');
      navigate('/roommates');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page page-top">
        <div className="container"><PageLoading /></div>
      </div>
    );
  }

  const areas = form.city && places.areas?.[form.city] ? places.areas[form.city] : [];

  return (
    <div className="page page-top">
      <div className="container container-narrow">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <Link to="/roommates">Roommates</Link>
          <ChevronRight size={13} />
          <span>{existed ? 'Edit profile' : 'Create profile'}</span>
        </nav>

        <div className="page-header">
          <div>
            <h1 className="display">{existed ? 'Your roommate profile' : 'Tell us how you live'}</h1>
            <p>
              This profile powers your compatibility scores. Be honest about budget and habits —
              better inputs mean better matches for everyone.
            </p>
          </div>
        </div>

        <div className="form-layout">
          <form className="form-card stack-lg" onSubmit={submit}>
            {error && <div className="alert alert-error">{error}</div>}

            <section className="form-section">
              <div className="form-section-head">
                <span className="step-number">01</span>
                <div>
                  <h2>Basics</h2>
                  <p>Who you are and where you want to live.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="rm-age">Age</label>
                  <input id="rm-age" className="input" type="number" min="16" max="100" required value={form.age} onChange={update('age')} />
                </div>
                <div className="field">
                  <label htmlFor="rm-gender">Gender</label>
                  <select id="rm-gender" className="select" required value={form.gender} onChange={update('gender')}>
                    <option value="">Select</option>
                    {Object.entries(GENDER_LABELS).filter(([value]) => value !== 'any').map(([value, label]) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rm-city">City</label>
                  <input id="rm-city" className="input" list="profile-cities" required value={form.city} onChange={update('city')} placeholder="e.g. Bengaluru" />
                  <datalist id="profile-cities">
                    {places.cities.map((city) => <option value={city} key={city} />)}
                  </datalist>
                </div>
                <div className="field">
                  <label htmlFor="rm-locality">Preferred locality</label>
                  <input id="rm-locality" className="input" list="profile-areas" value={form.locality} onChange={update('locality')} placeholder="Optional" />
                  <datalist id="profile-areas">
                    {areas.map((area) => <option value={area} key={area} />)}
                  </datalist>
                </div>
                <div className="field">
                  <label htmlFor="rm-occupation">You are a</label>
                  <select id="rm-occupation" className="select" required value={form.occupation} onChange={update('occupation')}>
                    <option value="">Select</option>
                    {Object.entries(OCCUPATION_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rm-company">College or company</label>
                  <input id="rm-company" className="input" value={form.collegeOrCompany} onChange={update('collegeOrCompany')} placeholder="Optional" maxLength={160} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <span className="step-number">02</span>
                <div>
                  <h2>Budget & home</h2>
                  <p>What you can spend and the kind of place you want.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="rm-budget-min">Minimum monthly budget</label>
                  <input id="rm-budget-min" className="input" type="number" min="0" required value={form.budgetMin} onChange={update('budgetMin')} placeholder="₹" />
                </div>
                <div className="field">
                  <label htmlFor="rm-budget-max">Maximum monthly budget</label>
                  <input id="rm-budget-max" className="input" type="number" min="0" required value={form.budgetMax} onChange={update('budgetMax')} placeholder="₹" />
                </div>
                <div className="field">
                  <label htmlFor="rm-accommodation">Accommodation preference</label>
                  <select id="rm-accommodation" className="select" required value={form.accommodationType} onChange={update('accommodationType')}>
                    <option value="">Select</option>
                    <option value="hostel">Hostel</option>
                    <option value="pg">PG</option>
                    <option value="single_room">Single room</option>
                    <option value="shared_room">Shared room</option>
                    <option value="flat">Flat</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rm-preferred-gender">Preferred roommate gender</label>
                  <select id="rm-preferred-gender" className="select" value={form.preferredGender} onChange={update('preferredGender')}>
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <span className="step-number">03</span>
                <div>
                  <h2>Daily life</h2>
                  <p>These details carry the most weight in compatibility matching.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="rm-food">Food preference</label>
                  <select id="rm-food" className="select" required value={form.foodPreference} onChange={update('foodPreference')}>
                    <option value="">Select</option>
                    <option value="veg">Vegetarian</option>
                    <option value="non_veg">Non-vegetarian</option>
                    <option value="any">Open to anything</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rm-sleep">Sleep schedule</label>
                  <select id="rm-sleep" className="select" required value={form.sleepSchedule} onChange={update('sleepSchedule')}>
                    <option value="">Select</option>
                    {Object.entries(SLEEP_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rm-smoking">Smoking</label>
                  <select id="rm-smoking" className="select" required value={form.smoking} onChange={update('smoking')}>
                    <option value="">Select</option>
                    {Object.entries(SMOKING_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rm-cleanliness">Cleanliness</label>
                  <select id="rm-cleanliness" className="select" required value={form.cleanliness} onChange={update('cleanliness')}>
                    <option value="">Select</option>
                    {Object.entries(CLEANLINESS_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <span className="filter-group-title">Lifestyle interests</span>
                <div className="chip-check-grid">
                  {Object.entries(LIFESTYLE_LABELS).map(([value, label]) => {
                    const active = form.lifestyle.includes(value);
                    return (
                      <button
                        type="button"
                        className={`chip-check ${active ? 'active' : ''}`}
                        key={value}
                        onClick={() => toggleLifestyle(value)}
                        aria-pressed={active}
                      >
                        {active && <Check size={12} />} {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-head">
                <span className="step-number">04</span>
                <div>
                  <h2>Your introduction</h2>
                  <p>Give people something real to respond to.</p>
                </div>
              </div>
              <div className="field">
                <label htmlFor="rm-bio">Bio</label>
                <textarea
                  id="rm-bio"
                  className="textarea"
                  rows={5}
                  maxLength={700}
                  value={form.bio}
                  onChange={update('bio')}
                  placeholder="What are you looking for, and what is living with you like?"
                />
                <span className="field-hint">{form.bio.length}/700 characters</span>
              </div>
              <label className="switch-row">
                <span>
                  <strong>{form.isVisible ? <><Eye size={15} /> Profile visible to other members</> : <><EyeOff size={15} /> Profile hidden</>}</strong>
                  <span className="small muted">Hidden profiles are not shown in roommate search and cannot receive requests.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(event) => setForm({ ...form, isVisible: event.target.checked })}
                />
              </label>
            </section>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving…' : existed ? 'Save changes' : 'Create profile'}
              </button>
              <Link to="/roommates" className="btn btn-ghost">Cancel</Link>
            </div>
          </form>

          <aside className="form-side">
            <div className="form-side-card">
              <span className="why-icon"><Sparkles size={18} /></span>
              <h3>How the score works</h3>
              <p>Every compatibility percentage comes from real profile fields — no randomness.</p>
              <ul className="side-points">
                <li><span>25 pts</span> Budget ranges overlap</li>
                <li><span>20 pts</span> Same city and locality</li>
                <li><span>15 pts</span> Same accommodation type</li>
                <li><span>10 pts</span> Food and sleep match</li>
                <li><span>20 pts</span> Smoking, cleanliness, lifestyle</li>
              </ul>
            </div>
            <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
              <ShieldCheck size={18} />
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>Privacy stays in your control</strong>
                <span className="small" style={{ lineHeight: 1.55 }}>
                  Your phone and email are never public. They are shared only after you accept a
                  roommate request.
                </span>
              </div>
            </div>
            <Link to="/roommates" className="link-arrow">
              Browse roommate profiles <ArrowRight size={15} />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
