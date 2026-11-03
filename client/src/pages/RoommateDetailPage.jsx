import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  Flag,
  GraduationCap,
  IndianRupee,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils
} from 'lucide-react';
import api from '../api/client';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import RoommateRequestModal from '../components/RoommateRequestModal';
import ReportModal from '../components/ReportModal';
import {
  CLEANLINESS_LABELS,
  FOOD_PREFERENCE_LABELS,
  GENDER_LABELS,
  LIFESTYLE_LABELS,
  OCCUPATION_LABELS,
  PROPERTY_TYPE_LABELS,
  SLEEP_LABELS,
  SMOKING_LABELS,
  formatCurrency
} from '../utils/format';

export default function RoommateDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [requestState, setRequestState] = useState(null);
  const profile = data?.profile;

  usePageMeta(
    profile ? `${profile.user?.name || 'Roommate'} in ${profile.city}` : 'Roommate profile',
    profile ? `Roommate profile in ${profile.city} with ${profile.compatibility || 0}% compatibility.` : ''
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/roommates/${id}`)
      .then(({ data: payload }) => {
        if (!active) return;
        setData(payload);
        setRequestState(payload.request);
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

  if (loading) {
    return (
      <div className="page page-top">
        <div className="container">
          <div className="skeleton skeleton-line w-45" style={{ height: 18, marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 260, borderRadius: 24 }} />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page page-top">
        <div className="container">
          <div className="error-state">
            <span className="empty-icon"><Users size={26} /></span>
            <h2>Roommate profile not available</h2>
            <p>{error || 'This profile may be hidden or no longer public.'}</p>
            <Link to="/roommates" className="btn btn-primary" style={{ marginTop: 14 }}>Browse roommates</Link>
          </div>
        </div>
      </div>
    );
  }

  const isPending = requestState?.status === 'pending';
  const isAccepted = requestState?.status === 'accepted';
  const isSelf = user?.id === profile.user?.id;

  return (
    <div className="page page-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <Link to="/roommates">Roommates</Link>
          <ChevronRight size={13} />
          <span>{profile.user?.name}</span>
        </nav>

        <div className="roommate-profile-hero">
          <div className="roommate-profile-identity">
            <Avatar src={profile.user?.avatar} name={profile.user?.name} size="xl" />
            <div>
              <div className="detail-badges" style={{ marginBottom: 8 }}>
                <span className="badge badge-teal"><Check size={12} /> Roommate profile</span>
                {profile.user?.isDemo && <span className="badge badge-demo">Demo profile</span>}
              </div>
              <h1 className="detail-title">{profile.user?.name}</h1>
              <div className="detail-sub">
                <span>{profile.age} years</span>
                <span><MapPin size={14} /> {profile.locality ? `${profile.locality}, ` : ''}{profile.city}</span>
                <span><BriefcaseBusiness size={14} /> {OCCUPATION_LABELS[profile.occupation] || profile.occupation}</span>
                <span>{GENDER_LABELS[profile.gender] || profile.gender}</span>
              </div>
              <p className="small muted" style={{ marginTop: 10 }}>
                {profile.user?.bio || 'No profile bio added yet.'}
              </p>
            </div>
          </div>
          {profile.compatibility !== null && profile.compatibility !== undefined && (
            <div className="compat-ring compat-ring-lg" style={{ '--score': profile.compatibility }}>
              <span>{profile.compatibility}<small>%</small></span>
            </div>
          )}
        </div>

        <div className="detail-layout" style={{ marginTop: 26 }}>
          <div className="detail-main">
            <section className="detail-block">
              <h2>About {profile.user?.name?.split(' ')[0] || 'this roommate'}</h2>
              <p className="description">
                {profile.bio || 'This member has not written a long bio yet. Send a request to introduce yourself and ask about their preferences.'}
              </p>
            </section>

            <section className="detail-block">
              <h2>Looking for</h2>
              <div className="profile-facts-grid">
                <div className="profile-fact">
                  <span className="profile-fact-icon"><IndianRupee size={17} /></span>
                  <div>
                    <span>Budget range</span>
                    <strong>{formatCurrency(profile.budgetMin)} – {formatCurrency(profile.budgetMax)} /month</strong>
                  </div>
                </div>
                <div className="profile-fact">
                  <span className="profile-fact-icon"><MapPin size={17} /></span>
                  <div>
                    <span>Preferred area</span>
                    <strong>{profile.locality || profile.city}</strong>
                  </div>
                </div>
                <div className="profile-fact">
                  <span className="profile-fact-icon"><Users size={17} /></span>
                  <div>
                    <span>Accommodation</span>
                    <strong>{PROPERTY_TYPE_LABELS[profile.accommodationType] || profile.accommodationType}</strong>
                  </div>
                </div>
                <div className="profile-fact">
                  <span className="profile-fact-icon"><GraduationCap size={17} /></span>
                  <div>
                    <span>Student / professional</span>
                    <strong>{OCCUPATION_LABELS[profile.occupation] || profile.occupation}</strong>
                  </div>
                </div>
                {profile.collegeOrCompany && (
                  <div className="profile-fact">
                    <span className="profile-fact-icon"><BriefcaseBusiness size={17} /></span>
                    <div>
                      <span>College / company</span>
                      <strong>{profile.collegeOrCompany}</strong>
                    </div>
                  </div>
                )}
                <div className="profile-fact">
                  <span className="profile-fact-icon"><Utensils size={17} /></span>
                  <div>
                    <span>Food preference</span>
                    <strong>{FOOD_PREFERENCE_LABELS[profile.foodPreference] || profile.foodPreference}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="detail-block">
              <h2>Living habits</h2>
              <div className="price-rows" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
                <div className="price-row"><span><Clock3 size={13} /> Sleep schedule</span><strong>{SLEEP_LABELS[profile.sleepSchedule] || profile.sleepSchedule}</strong></div>
                <div className="price-row"><span>Smoking</span><strong>{SMOKING_LABELS[profile.smoking] || profile.smoking}</strong></div>
                <div className="price-row"><span>Cleanliness</span><strong>{CLEANLINESS_LABELS[profile.cleanliness] || profile.cleanliness}</strong></div>
                <div className="price-row"><span>Preferred roommate gender</span><strong>{GENDER_LABELS[profile.preferredGender] || profile.preferredGender}</strong></div>
              </div>
            </section>

            {profile.lifestyle?.length > 0 && (
              <section className="detail-block">
                <h2>Lifestyle interests</h2>
                <div className="chip-row">
                  {profile.lifestyle.map((item) => (
                    <span className="chip" key={item}>{LIFESTYLE_LABELS[item] || item.replace('_', ' ')}</span>
                  ))}
                </div>
              </section>
            )}

            <section className="detail-block">
              <div className="row-between" style={{ marginBottom: 12 }}>
                <h2 style={{ marginBottom: 0 }}>Why you match</h2>
                {profile.compatibility === null && <span className="badge badge-amber">Create a profile to see your score</span>}
              </div>
              {profile.compatibility === null ? (
                <div className="stack">
                  <p className="small muted" style={{ lineHeight: 1.65 }}>
                    Compatibility is personal. Create a roommate profile with your budget, city,
                    schedule and lifestyle so StayMate can compare it with this profile.
                  </p>
                  <Link to="/roommates/profile" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                    Create my profile <ArrowRight size={14} />
                  </Link>
                </div>
              ) : profile.compatibilityBreakdown?.length ? (
                <>
                  <div className="compat-breakdown">
                    {profile.compatibilityBreakdown.map((item) => (
                      <div className="compat-breakdown-row" key={item.label}>
                        <span className={item.points > 0 ? 'compat-check on' : 'compat-check'}>
                          {item.points > 0 ? <Check size={13} /> : '—'}
                        </span>
                        <span>{item.label}</span>
                        <strong>{item.points > 0 ? `+${item.points}` : '0'} pts</strong>
                      </div>
                    ))}
                  </div>
                  <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
                    This score reflects the details in both profiles, not a guarantee of compatibility.
                    Always discuss expectations before committing to a shared home.
                  </p>
                </>
              ) : (
                <p className="small muted">No compatibility breakdown available.</p>
              )}
            </section>

            <div className="row-between">
              {!isSelf && (
                <button type="button" className="btn-link small" onClick={() => setReportOpen(true)} style={{ display: 'inline-flex', gap: 6 }}>
                  <Flag size={13} /> Report this profile
                </button>
              )}
              <Link to="/roommates" className="btn-link small" style={{ display: 'inline-flex', gap: 6 }}>
                <ArrowLeft size={13} /> Back to all roommates
              </Link>
            </div>
          </div>

          <aside className="detail-side">
            <div className="price-card">
              {isSelf ? (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>This is your profile</h3>
                  <p className="small muted" style={{ lineHeight: 1.6 }}>
                    Keep your budget, locality and habits up to date so your compatibility scores stay useful.
                  </p>
                  <Link to="/roommates/profile" className="btn btn-primary btn-block">
                    Edit my profile <ArrowRight size={15} />
                  </Link>
                </>
              ) : isAccepted ? (
                <>
                  <span className="badge badge-teal" style={{ marginBottom: 10 }}><Check size={12} /> Connected</span>
                  <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>You are connected</h3>
                  <p className="small muted" style={{ lineHeight: 1.6 }}>
                    Your request was accepted. Contact details are available in your connections dashboard.
                  </p>
                  <Link to="/dashboard/connections" className="btn btn-primary btn-block">
                    View connection <ArrowRight size={15} />
                  </Link>
                </>
              ) : isPending ? (
                <>
                  <span className="badge badge-amber" style={{ marginBottom: 10 }}>Request pending</span>
                  <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>Waiting for a response</h3>
                  <p className="small muted" style={{ lineHeight: 1.6 }}>
                    Your roommate request has been sent. You will get a notification when they respond.
                  </p>
                  <Link to="/dashboard/requests" className="btn btn-outline btn-block">
                    Manage requests <ArrowRight size={15} />
                  </Link>
                </>
              ) : (
                <>
                  <div className="price-card-head">
                    <strong style={{ fontSize: '1.15rem' }}>Interested in living together?</strong>
                  </div>
                  <p className="small muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
                    Send a short introduction. Contact details stay private until the request is accepted.
                  </p>
                  {data.viewerHasProfile ? (
                    <button type="button" className="btn btn-primary btn-block" onClick={() => setRequestOpen(true)}>
                      <MessageCircle size={16} /> Send roommate request
                    </button>
                  ) : (
                    <Link to="/roommates/profile" className="btn btn-primary btn-block">
                      Create a profile to connect <ArrowRight size={15} />
                    </Link>
                  )}
                  {requestState?.status === 'rejected' && (
                    <p className="small muted" style={{ marginTop: 10, lineHeight: 1.55 }}>
                      A previous request was declined. You can send a new request if your preferences have changed.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="price-card">
              <div className="row" style={{ gap: 8 }}>
                <Sparkles size={16} style={{ color: 'var(--teal-dark)' }} />
                <strong style={{ fontSize: '0.88rem' }}>Matching is two-way</strong>
              </div>
              <p className="small muted" style={{ marginTop: 7, lineHeight: 1.6 }}>
                {profile.user?.name?.split(' ')[0] || 'This member'} has also set preferences for the
                kind of roommate they want. Respecting those preferences improves everyone’s matches.
              </p>
            </div>

            <div className="alert alert-info" style={{ alignItems: 'flex-start' }}>
              <ShieldCheck size={18} />
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>Meet safely</strong>
                <span className="small" style={{ lineHeight: 1.55 }}>
                  Meet in a public place first, verify identity and never share financial details or
                  transfer money before viewing a property together.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {requestOpen && (
        <RoommateRequestModal
          profile={profile}
          onClose={() => setRequestOpen(false)}
          onSent={() => setRequestState({ status: 'pending' })}
        />
      )}
      {reportOpen && (
        <ReportModal targetType="user" targetId={profile.user?.id} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}
