import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Mail, MapPin, Phone, Users } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { PageLoading } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

export default function ConnectionsPage() {
  usePageMeta('Connections', 'Roommate requests that were accepted, with shared contact details.');
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/roommates/connections')
      .then(({ data }) => setItems(data.items))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const copy = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Connections</h2>
          <p>Accepted roommate requests. Contact details are shared only between connected members.</p>
        </div>
        <Link to="/roommates" className="btn btn-outline btn-sm"><Users size={14} /> Find roommates</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {items.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No connections yet"
          description="When you and another member both accept a roommate request, their contact details appear here."
          actionLabel="Browse compatible profiles"
          actionTo="/roommates"
        />
      ) : (
        <div className="connection-grid">
          {items.map((item) => (
            <article className="connection-card" key={item.requestId}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar src={item.user.avatar} name={item.user.name} size="lg" />
                <div>
                  <h3>{item.user.name}{item.user.isDemo && <span className="badge badge-demo" style={{ marginLeft: 6 }}>Demo</span>}</h3>
                  <p className="small muted">
                    {item.profile?.occupation ? item.profile.occupation.replace('_', ' ') : 'Roommate connection'}
                    {' · '}Connected {item.connectedAt ? formatDate(item.connectedAt) : 'recently'}
                  </p>
                </div>
              </div>
              <div className="connection-facts">
                <span><MapPin size={14} /> {item.user.city || item.profile?.city || 'City not listed'}</span>
                {item.profile?.budgetMin !== undefined && (
                  <span>₹{Number(item.profile.budgetMin).toLocaleString('en-IN')}–₹{Number(item.profile.budgetMax).toLocaleString('en-IN')} budget</span>
                )}
              </div>
              <div className="connection-contact">
                {item.user.phone ? (
                  <div className="contact-row">
                    <Phone size={15} />
                    <a href={`tel:${item.user.phone}`}>{item.user.phone}</a>
                    <button type="button" className="btn-link small" onClick={() => copy(item.user.phone, 'Phone number')}>Copy</button>
                  </div>
                ) : (
                  <div className="contact-row"><Phone size={15} /><span className="muted">No phone number added</span></div>
                )}
                {item.user.email && (
                  <div className="contact-row">
                    <Mail size={15} />
                    <a href={`mailto:${item.user.email}`}>{item.user.email}</a>
                    <button type="button" className="btn-link small" onClick={() => copy(item.user.email, 'Email')}>Copy</button>
                  </div>
                )}
              </div>
              {item.profile?.id && (
                <Link to={`/roommates/${item.profile.id}`} className="btn btn-outline btn-sm btn-block">View their profile</Link>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
