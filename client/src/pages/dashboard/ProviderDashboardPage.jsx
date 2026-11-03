import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChefHat,
  Eye,
  MessageSquare,
  Plus,
  Sparkles,
  UtensilsCrossed
} from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useAuth } from '../../context/AuthContext';
import { PageLoading } from '../../components/Skeletons';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, timeAgo } from '../../utils/format';

export default function ProviderDashboardPage() {
  usePageMeta('Provider Dashboard', 'Manage your food service, meal plans and customer enquiries.');
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/food/mine'),
      api.get('/enquiries/received'),
      api.get('/notifications?limit=5')
    ]).then((results) => {
      if (!active) return;
      const value = (index, fallback) =>
        results[index].status === 'fulfilled' ? results[index].value.data : fallback;
      setData({
        listings: value(0, { items: [] }).items,
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

  const live = data.listings.filter((item) => item.status === 'approved');
  const pending = data.listings.filter((item) => item.status === 'pending');
  const newEnquiries = data.enquiries.filter((item) => item.status === 'new');
  const totalViews = data.listings.reduce((sum, item) => sum + (item.views || 0), 0);
  const planCount = data.listings.reduce((sum, item) => sum + (item.mealPlans?.length || 0), 0);

  return (
    <>
      <div className="dash-welcome">
        <div>
          <h2>Hello, {user?.name?.split(' ')[0] || 'chef'}.</h2>
          <p>
            {data.listings.length === 0
              ? 'Add your mess or tiffin service to start receiving meal enquiries. Listings are reviewed before going live.'
              : `${live.length} service${live.length === 1 ? '' : 's'} live with ${planCount} meal plan${planCount === 1 ? '' : 's'} and ${newEnquiries.length} new enquir${newEnquiries.length === 1 ? 'y' : 'ies'}.`}
          </p>
        </div>
        <Link to="/provider/listings/new" className="btn btn-light"><Plus size={16} /> Add food service</Link>
      </div>

      <div className="stat-grid">
        <Link to="/provider/listings" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">My services</span><span className="stat-icon"><ChefHat size={16} /></span></div>
          <strong>{data.listings.length}</strong>
          <small>{pending.length} awaiting approval</small>
        </Link>
        <Link to="/provider/listings" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">Live services</span><span className="stat-icon"><CheckCircle2 size={16} /></span></div>
          <strong>{live.length}</strong>
          <small>Visible to customers</small>
        </Link>
        <Link to="/provider/enquiries" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">New enquiries</span><span className="stat-icon"><MessageSquare size={16} /></span></div>
          <strong>{newEnquiries.length}</strong>
          <small>{data.enquiries.length} total enquiries</small>
        </Link>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-label">Listing views</span><span className="stat-icon"><Eye size={16} /></span></div>
          <strong>{totalViews}</strong>
          <small>Across all your services</small>
        </div>
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Your food services</h3>
              <p>Service status and meal plans.</p>
            </div>
            <Link to="/provider/listings" className="link-arrow">Manage all <ArrowRight size={14} /></Link>
          </div>
          {data.listings.length === 0 ? (
            <div className="dash-empty">
              <span className="empty-icon"><ChefHat size={22} /></span>
              <h4>No food services yet</h4>
              <p>Add your mess, tiffin or meal plan service with real photos and an accurate monthly price.</p>
              <Link to="/provider/listings/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add your first service</Link>
            </div>
          ) : (
            <div className="activity-list">
              {data.listings.slice(0, 5).map((listing) => (
                <div className="activity-item" key={listing._id}>
                  <span className="activity-icon"><UtensilsCrossed size={15} /></span>
                  <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row-between" style={{ alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p>{listing.businessName}</p>
                        <span>{listing.area}, {listing.city} · {formatCurrency(listing.pricePerMonth)}/month</span>
                      </div>
                      <StatusBadge status={listing.status} />
                    </div>
                    <span className="small muted" style={{ display: 'block', marginTop: 4 }}>
                      {listing.mealPlans?.length || 0} meal plan{listing.mealPlans?.length === 1 ? '' : 's'} · {listing.views || 0} views
                    </span>
                  </div>
                  <Link to={`/provider/listings/${listing._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
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
                <p>Reply quickly to new customers.</p>
              </div>
              <Link to="/provider/enquiries" className="link-arrow" style={{ fontSize: '0.76rem' }}>View all</Link>
            </div>
            {data.enquiries.length === 0 ? (
              <div className="dash-empty" style={{ padding: '8px 0 0' }}>
                <span className="empty-icon"><MessageSquare size={22} /></span>
                <h4>No enquiries yet</h4>
                <p>Meal enquiries from customers will appear here.</p>
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
              <Link to="/provider/listings/new" className="quick-action"><Plus size={18} /> Add food service</Link>
              <Link to="/provider/listings" className="quick-action"><ChefHat size={18} /> My services</Link>
              <Link to="/provider/enquiries" className="quick-action"><MessageSquare size={18} /> Enquiries</Link>
              <Link to="/provider/settings" className="quick-action"><Sparkles size={18} /> Profile settings</Link>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head" style={{ marginBottom: 10 }}>
              <h3>Latest notifications</h3>
              <Link to="/provider/notifications" className="link-arrow" style={{ fontSize: '0.76rem' }}>View all</Link>
            </div>
            {data.notifications.length === 0 ? (
              <p className="small muted">No notifications yet.</p>
            ) : (
              <div className="activity-list">
                {data.notifications.slice(0, 3).map((notification) => (
                  <div className="activity-item" key={notification._id}>
                    <span className="activity-icon"><Bell size={15} /></span>
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
