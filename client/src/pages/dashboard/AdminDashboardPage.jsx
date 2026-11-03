import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Flag,
  ShieldCheck,
  Star,
  Users,
  UtensilsCrossed
} from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import { PageLoading } from '../../components/Skeletons';
import { formatDate, timeAgo } from '../../utils/format';

export default function AdminDashboardPage() {
  usePageMeta('Admin Dashboard', 'Moderate listings, reports, reviews and members on StayMate.');
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/stats')
      .then(({ data: payload }) => setData(payload))
      .catch((loadError) => toast.error(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approveProperty = async (property) => {
    setBusy(property._id);
    try {
      await api.patch(`/admin/properties/${property._id}`, { status: 'approved' });
      toast.success(`${property.name} approved.`);
      load();
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy('');
    }
  };

  if (loading) return <PageLoading />;
  if (!data) return <div className="alert alert-error">Could not load admin statistics.</div>;

  const { stats } = data;

  return (
    <>
      <div className="dash-welcome" style={{ background: 'linear-gradient(120deg,#0b1f2a,#193b4a)' }}>
        <div>
          <h2>Platform overview</h2>
          <p>
            {stats.pendingProperties + stats.pendingFood} listing{stats.pendingProperties + stats.pendingFood === 1 ? '' : 's'} awaiting review
            {' · '}{stats.openReports} open report{stats.openReports === 1 ? '' : 's'}.
          </p>
        </div>
        <Link to="/admin/listings" className="btn btn-light"><ShieldCheck size={16} /> Review listings</Link>
      </div>

      <div className="stat-grid">
        <Link to="/admin/users" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">Members</span><span className="stat-icon"><Users size={16} /></span></div>
          <strong>{stats.totalUsers}</strong>
          <small>{stats.newUsers} joined this week</small>
        </Link>
        <Link to="/admin/listings" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">Properties</span><span className="stat-icon"><Building2 size={16} /></span></div>
          <strong>{stats.totalProperties}</strong>
          <small>{stats.pendingProperties} pending · {stats.approvedProperties} live</small>
        </Link>
        <Link to="/admin/food" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">Food services</span><span className="stat-icon"><UtensilsCrossed size={16} /></span></div>
          <strong>{stats.totalFood}</strong>
          <small>{stats.pendingFood} pending · {stats.approvedFood} live</small>
        </Link>
        <Link to="/admin/reports" className="stat-card stat-card-link">
          <div className="stat-card-top"><span className="stat-label">Open reports</span><span className="stat-icon"><Flag size={16} /></span></div>
          <strong>{stats.openReports}</strong>
          <small>{stats.enquiries} total enquiries</small>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Listings awaiting review</h3>
              <p>Approve accurate, complete listings. Reject incomplete or unsafe ones with a reason.</p>
            </div>
            <Link to="/admin/listings" className="link-arrow">All properties <ArrowRight size={14} /></Link>
          </div>
          {data.recentProperties.length === 0 ? (
            <div className="dash-empty">
              <span className="empty-icon"><CheckCircle2 size={22} /></span>
              <h4>No pending properties</h4>
              <p>New property submissions will appear here.</p>
            </div>
          ) : (
            <div className="activity-list">
              {data.recentProperties.map((property) => (
                <div className="activity-item" key={property._id}>
                  <span className="activity-icon"><Building2 size={15} /></span>
                  <div className="activity-body" style={{ flex: 1, minWidth: 0 }}>
                    <p>{property.name}</p>
                    <span>{property.area}, {property.city} · {property.owner?.name || 'Unknown owner'} · {timeAgo(property.createdAt)}</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <Link to="/admin/listings" className="btn btn-outline btn-sm">Review</Link>
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => approveProperty(property)} disabled={busy === property._id}>
                      {busy === property._id ? 'Approving…' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="dash-stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Open reports</h3>
                <p>Review flagged content promptly.</p>
              </div>
              <Link to="/admin/reports" className="link-arrow" style={{ fontSize: '0.76rem' }}>View all</Link>
            </div>
            {data.recentReports.length === 0 ? (
              <div className="dash-empty" style={{ padding: '8px 0 0' }}>
                <span className="empty-icon"><ShieldCheck size={22} /></span>
                <h4>No open reports</h4>
                <p>Nothing needs moderation right now.</p>
              </div>
            ) : (
              <div className="activity-list">
                {data.recentReports.map((report) => (
                  <div className="activity-item" key={report._id}>
                    <span className="activity-icon"><AlertTriangle size={15} /></span>
                    <div className="activity-body">
                      <p>{report.reason}</p>
                      <span>{report.reporter?.name || 'Member'} · {timeAgo(report.createdAt)}</span>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head" style={{ marginBottom: 12 }}>
              <h3>Quick links</h3>
            </div>
            <div className="quick-actions">
              <Link to="/admin/listings" className="quick-action"><Building2 size={18} /> Properties</Link>
              <Link to="/admin/food" className="quick-action"><UtensilsCrossed size={18} /> Food</Link>
              <Link to="/admin/reports" className="quick-action"><Flag size={18} /> Reports</Link>
              <Link to="/admin/reviews" className="quick-action"><Star size={18} /> Reviews</Link>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head" style={{ marginBottom: 10 }}>
              <h3>Newest members</h3>
              <Link to="/admin/users" className="link-arrow" style={{ fontSize: '0.76rem' }}>All members</Link>
            </div>
            {data.recentUsers.length === 0 ? (
              <p className="small muted">No members yet.</p>
            ) : (
              <div className="activity-list">
                {data.recentUsers.slice(0, 4).map((member) => (
                  <div className="user-mini" key={member._id}>
                    <Avatar src={member.avatar} name={member.name} size="sm" />
                    <div>
                      <strong>{member.name}{member.isDemo && <span className="badge badge-demo" style={{ marginLeft: 6 }}>Demo</span>}</strong>
                      <span>{member.role.replace('_', ' ')} · joined {formatDate(member.createdAt)}</span>
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
