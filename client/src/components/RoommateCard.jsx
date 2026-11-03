import { Link } from 'react-router-dom';
import { BriefcaseBusiness, IndianRupee, MapPin, Utensils } from 'lucide-react';
import {
  FOOD_PREFERENCE_LABELS,
  OCCUPATION_LABELS,
  formatCurrency
} from '../utils/format';
import Avatar from './Avatar';

export default function RoommateCard({ profile, onSend, requesting, requestPending }) {
  return (
    <article className="roommate-card">
      <div className="roommate-card-top">
        <div className="roommate-identity">
          <Avatar src={profile.user?.avatar} name={profile.user?.name} size="md" />
          <div>
            <h3>
              {profile.user?.name}
              {profile.user?.isDemo && (
                <span className="badge badge-demo" style={{ marginLeft: 6 }}>
                  Demo
                </span>
              )}
            </h3>
            <p>
              {profile.age} · {OCCUPATION_LABELS[profile.occupation] || profile.occupation}
            </p>
          </div>
        </div>
        {profile.compatibility !== null && profile.compatibility !== undefined && (
          <div
            className="compat-ring"
            style={{ '--score': profile.compatibility }}
            title="Compatibility based on your saved roommate profile"
          >
            <span>
              {profile.compatibility}
              <small>%</small>
            </span>
          </div>
        )}
      </div>

      <p className="roommate-bio">{profile.bio || 'No bio added yet.'}</p>

      <div className="roommate-facts">
        <div>
          <MapPin size={13} /> {profile.locality || profile.city}
        </div>
        <div>
          <IndianRupee size={13} /> {formatCurrency(profile.budgetMin)}–{formatCurrency(profile.budgetMax)}
        </div>
        <div>
          <BriefcaseBusiness size={13} /> {OCCUPATION_LABELS[profile.occupation] || profile.occupation}
        </div>
        <div>
          <Utensils size={13} /> {FOOD_PREFERENCE_LABELS[profile.foodPreference] || profile.foodPreference}
        </div>
      </div>

      <div className="chip-row">
        {(profile.lifestyle || []).slice(0, 3).map((item) => (
          <span className="chip" key={item} style={{ textTransform: 'capitalize' }}>
            {item.replace('_', ' ')}
          </span>
        ))}
      </div>

      <div className="roommate-actions">
        <Link to={`/roommates/${profile.id}`} className="btn btn-outline btn-sm">
          View profile
        </Link>
        {requestPending ? (
          <button type="button" className="btn btn-soft btn-sm" disabled>
            Request pending
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onSend?.(profile)}
            disabled={requesting}
          >
            {requesting ? 'Sending…' : 'Send request'}
          </button>
        )}
      </div>
    </article>
  );
}
