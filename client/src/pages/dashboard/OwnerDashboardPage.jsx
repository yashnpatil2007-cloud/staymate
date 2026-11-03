import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  Eye,
  MessageSquare,
  Plus,
  Sparkles,
  Timer
} from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useAuth } from '../../context/AuthContext';
import { PageLoading } from '../../components/Skeletons';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, timeAgo } from '../../utils/format';

export default function OwnerDashboardPage() {
  usePageMeta('Owner Dashboard', 'Manage your property listings, availability and customer enquiries.');
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/properties/mine'),
      api.get('/enquiries/received'),
      api.get('/notifications?limit=5')
    ]).then((results) => {
      if (!active) return;
      const value = (index, fallback) =>
        results[index].status === 'fulfilled' ? results[index].value.data : fallback;
      setData({
        properties: value(0, { items: [] }).items,
        enquiries: value(1, { items: [] }).items,
        notifications: value(2, { items: [] }).items
      });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <PageLoading />;

  const live = data.properties.filter((item) => item.status === 'approved');
  const pending = data.properties.filter((item) => item.status === 'pending');
  const newEnquiries = data.enquiries.filter((item) => item.status === 'new');
  const totalViews = data.properties.reduce((sum, item) => sum + (item.views || 0), 0);

  return (
    <>
      <div className="dash-welcome">
        <div>
          <h2>Hello, {user?.name?.split(' ')[0] || 'owner'}.</h2>
          <p>
            {data.properties.length === 0
              ? 'Add your first property to start receiving customer enquiries. Listings are reviewed before going live.'
              : `${live.length} listing${live.length === 1 ? '' : 's'} live and ${newEnquiries.length} new enquir${newEnquiries.length === 1 ? 'y' : 'ies'} waiting.`}
          </p>
        </div>
        <Link to="/owner/listings/new" className="btn btn-light"><Plus size={16} /> Add property</Link>
      </div>

      <div className="stat-grid">
        <Link to="/owner/listings" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">My listings</span><span className="stat-icon"><Building2 size={16} /></span></div>
          <strong>{data.properties.length}</strong>
          <small>{pending.length} awaiting approval</small>
        </Link>
        <Link to="/owner/listings" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">Live listings</span><span className="stat-icon"><CheckCircle2 size={16} /></span></div>
          <strong>{live.length}</strong>
          <small>Visible to customers</small>
        </Link>
        <Link to="/owner/enquiries" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">New enquiries</span><span className="stat-icon"><MessageSquare size={16} /></span></div>
          <strong>{newEnquiries.length}</strong>
          <small>{data.enquiries.length} total enquiries</small>
        </Link>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Listing views</span><span className="stat-icon"><Eye size={16} /></span></div>
          <strong>{totalViews}</strong>
          <small>Across all your properties</small>
        </div>
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Your properties</h3>
              <p>Availability and approval status at a glance.</p>
            </div>
            <Link to="/owner/listings" className="link-arrow">Manage all <ArrowRight size={14} /></Link>
          </div>
          {data.properties.length === 0 ? (
            <div className="dash-empty">
              <span className="empty-icon"><Building2 size={22} /></span>
              <h4>No properties yet</h4>
              <p>Add your hostel, PG, room, flat or apartment. It will be reviewed before appearing publicly.</p>
              <Link to="/owner/listings/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add your first property</Link>
            </div>
          ) : (
            <div className="activity-list">
              {data.properties.slice(0, 5).map((property) => (
                <div className="activity-item" key={property._id}>
                  <span className="activity-icon"><Building2 size={15} /></span>
                  <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-between" style={{ alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p>{property.name}</p>
                        <span>{property.area}, {property.city} · {formatCurrency(property.rent)}/month</span>
                      </div>
                      <StatusBadge status={property.status} />
                    </div>
                    <div className="row" style={{ marginTop: 6, gap: 10 }}>
                      <span className="small muted">{property.availableBeds} of {property.totalBeds} beds available</span>
                      {property.status === 'rejected' && property.rejectionReason && (
                        <span className="field-error">{property.rejectionReason}</span>
                      )}
                    </div>
                  </div>
                  <Link to={`/owner/listings/${property._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="dash-stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Recent enquiries</h3>
                <p>Respond quickly to improve conversion.</p>
              </div>
              <Link to="/owner/enquiries" className="link-arrow" style={{ fontSize: '0.76rem' }}>View all</Link>
            </div>
            {data.enquiries.length === 0 ? (
              <div className="dash-empty" style={{ padding: '8px 0 0' }}>
                <span className="empty-icon"><MessageSquare size={22} /></span>
                <h4>No enquiries yet</h4>
                <p>Enquiries from interested customers will appear here.</p>
              </div>
            ) : (
              <div className="activity-list">
                {data.enquiries.slice(0, 4).map((enquiry) => (
                  <div className="activity-item" key={enquiry._id}>
                    <span className="activity-icon"><MessageSquare size={15} /></span>
                    <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                      <div className="row-between" style={{ gap: 8 }}>
                        <p>{enquiry.name}</p>
                        <StatusBadge status={enquiry.status} />
                      </div>
                      <span>{enquiry.listingName} · {timeAgo(enquiry.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head" style={{ marginBottom: 12 }}>
              <h3>Quick actions</h3>
            </div>
            <div className="quick-actions">
              <Link to="/owner/listings/new" className="quick-action"><Plus size={18} /> Add property</Link>
              <Link to="/owner/listings" className="quick-action"><Building2 size={18} /> My listings</Link>
              <Link to="/owner/enquiries" className="quick-action"><MessageSquare size={18} /> Enquiries</Link>
              <Link to="/owner/settings" className="quick-action"><Sparkles size={18} /> Profile settings</Link>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head" style={{ marginBottom: 10 }}>
              <h3>Latest notifications</h3>
              <Link to="/owner/notifications" className="link-arrow" style={{ fontSize: '0.76rem' }}>View all</Link>
            </div>
            {data.notifications.length === 0 ? (
              <p className="small muted">No notifications yet.</p>
            ) : (
              <div className="activity-list">
                {data.notifications.slice(0, 3).map((notification) => (
                  <div className="activity-item" key={notification._id}>
                    <span className="activity-icon">{notification.type === 'listing_status' ? <Timer size={15} /> : <Bell size={15} />}</span>
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
