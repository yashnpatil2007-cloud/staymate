import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Handshake,
  Heart,
  MessageSquare,
  Search,
  Sparkles,
  UserPlus,
  Users,
  UtensilsCrossed
} from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useAuth } from '../../context/AuthContext';
import { PageLoading } from '../../components/Skeletons';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, timeAgo } from '../../utils/format';

export default function CustomerDashboardPage() {
  usePageMeta('My Dashboard', 'Your saved stays, roommate requests, connections and enquiries.');
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/saved'),
      api.get('/roommates/requests/received'),
      api.get('/roommates/requests/sent'),
      api.get('/roommates/connections'),
      api.get('/enquiries/mine'),
      api.get('/roommates/profile/me'),
      api.get('/notifications?limit=5')
    ]).then((results) => {
      if (!active) return;
      const value = (index, fallback) =>
        results[index].status === 'fulfilled' ? results[index].value.data : fallback;
      setData({
        saved: value(0, { items: [] }).items,
        received: value(1, { items: [] }).items,
        sent: value(2, { items: [] }).items,
        connections: value(3, { items: [] }).items,
        enquiries: value(4, { items: [] }).items,
        roommateProfile: value(5, { profile: null }).profile,
        notifications: value(6, { items: [] }).items
      });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <PageLoading />;

  const pendingReceived = data.received.filter((request) => request.status === 'pending');
  const openEnquiries = data.enquiries.filter((enquiry) => enquiry.status !== 'closed');

  return (
    <>
      <div className="dash-welcome">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'there'}.</h2>
          <p>
            Your saved stays, roommate conversations and enquiries are all here. Start with a
            shortlist or check who has replied.
          </p>
        </div>
        <Link to="/accommodations" className="btn btn-light">
          <Search size={16} /> Explore stays
        </Link>
      </div>

      <div className="stat-grid">
        <Link to="/dashboard/saved" className="stat-card stat-card-link">
          <div className="stat-card-top">
            <span className="stat-label">Saved listings</span>
            <span className="stat-icon"><Heart size={16} /></span>
          </div>
          <strong>{data.saved.length}</strong>
          <small>Stays and food services</small>
        </Link>
        <Link to="/dashboard/requests" className="stat-card stat-card-link">
          <div className="stat-card-top">
            <span className="stat-label">Pending requests</span>
            <span className="stat-icon"><Users size={16} /></span>
          </div>
          <strong>{pendingReceived.length}</strong>
          <small>{data.sent.filter((item) => item.status === 'pending').length} sent awaiting reply</small>
        </Link>
        <Link to="/dashboard/connections" className="stat-card stat-card-link">
          <div className="stat-card-top">
            <span className="stat-label">Connections</span>
            <span className="stat-icon"><Handshake size={16} /></span>
          </div>
          <strong>{data.connections.length}</strong>
          <small>Accepted roommate requests</small>
        </Link>
        <Link to="/dashboard/enquiries" className="stat-card stat-card-link">
          <div className="stat-card-top">
            <span className="stat-label">Open enquiries</span>
            <span className="stat-icon"><MessageSquare size={16} /></span>
          </div>
          <strong>{openEnquiries.length}</strong>
          <small>Across stays and food</small>
        </Link>
      </div>

      <div className="dash-grid">
        <div className="dash-stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Recent enquiries</h3>
                <p>Provider responses and listing updates appear here.</p>
              </div>
              <Link to="/dashboard/enquiries" className="link-arrow">View all <ArrowRight size={14} /></Link>
            </div>
            {data.enquiries.length === 0 ? (
              <div className="dash-empty">
                <span className="empty-icon"><MessageSquare size={22} /></span>
                <h4>No enquiries yet</h4>
                <p>Open a listing and contact the owner or food provider to start a conversation.</p>
                <Link to="/accommodations" className="btn btn-primary btn-sm">Browse accommodation</Link>
              </div>
            ) : (
              <div className="activity-list">
                {data.enquiries.slice(0, 5).map((enquiry) => (
                  <div className="activity-item" key={enquiry.id}>
                    <span className="activity-icon">
                      {enquiry.listingType === 'food' ? <UtensilsCrossed size={15} /> : <Search size={15} />}
                    </span>
                    <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                      <div className="row-between" style={{ gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <p>{enquiry.listingName}</p>
                          <span>{formatDate(enquiry.createdAt)} · {enquiry.listingType === 'food' ? 'Food' : 'Accommodation'}</span>
                        </div>
                        <StatusBadge status={enquiry.status} />
                      </div>
                      <p className="msg-preview" style={{ marginTop: 8 }}>{enquiry.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Your shortlist</h3>
                <p>Recently saved places and kitchens.</p>
              </div>
              <Link to="/dashboard/saved" className="link-arrow">All saved <ArrowRight size={14} /></Link>
            </div>
            {data.saved.length === 0 ? (
              <div className="dash-empty">
                <span className="empty-icon"><Heart size={22} /></span>
                <h4>Nothing saved yet</h4>
                <p>Save stays and food services while browsing to compare them later.</p>
              </div>
            ) : (
              <div className="saved-mini-grid">
                {data.saved.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    to={item.listingType === 'property' ? `/accommodations/${item.listing._id}` : `/food/${item.listing._id}`}
                    className="saved-mini-card"
                  >
                    <span className="saved-mini-type">{item.listingType === 'food' ? 'Food' : 'Stay'}</span>
                    <strong>{item.listing.name || item.listing.businessName}</strong>
                    <span>{item.listing.area}, {item.listing.city}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dash-stack">
          <section className="panel">
            <div className="panel-head">
              <h3>Quick actions</h3>
            </div>
            <div className="quick-actions">
              <Link to="/accommodations" className="quick-action"><Search size={18} /> Find a stay</Link>
              <Link to="/food" className="quick-action"><UtensilsCrossed size={18} /> Find food</Link>
              <Link to="/roommates" className="quick-action"><Users size={18} /> Find roommates</Link>
              <Link to="/dashboard/requests" className="quick-action"><Bell size={18} /> Check requests</Link>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Roommate profile</h3>
                <p>Used to calculate your compatibility scores.</p>
              </div>
            </div>
            {data.roommateProfile ? (
              <>
                <div className="mini-profile-row">
                  <span className="stat-icon"><Sparkles size={17} /></span>
                  <div>
                    <strong>{data.roommateProfile.city}</strong>
                    <span>{data.roommateProfile.locality || 'Locality not set'} · {data.roommateProfile.occupation?.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="divider" style={{ margin: '14px 0' }} />
                <Link to="/roommates/profile" className="btn btn-outline btn-sm btn-block">Update profile</Link>
              </>
            ) : (
              <div className="dash-empty" style={{ padding: '8px 0 0' }}>
                <span className="empty-icon"><UserPlus size={22} /></span>
                <h4>Create your profile</h4>
                <p>Add your budget and habits to see compatibility scores and receive requests.</p>
                <Link to="/roommates/profile" className="btn btn-primary btn-sm">Create profile</Link>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Latest notifications</h3>
              <Link to="/dashboard/notifications" className="link-arrow" style={{ fontSize: '0.76rem' }}>View all</Link>
            </div>
            {data.notifications.length === 0 ? (
              <p className="small muted">No notifications yet.</p>
            ) : (
              <div className="activity-list">
                {data.notifications.slice(0, 4).map((notification) => (
                  <div className="activity-item" key={notification._id}>
                    <span className={`dot-indicator ${notification.read ? '' : 'unread'}`} />
                    <div className="activity-body">
                      <p>{notification.title}</p>
                      <span>{timeAgo(notification.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
