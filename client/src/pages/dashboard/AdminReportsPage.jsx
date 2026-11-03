import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Flag, XCircle } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { PageLoading } from '../../components/Skeletons';
import { formatDate, timeAgo } from '../../utils/format';

const FILTERS = ['open', 'reviewed', 'dismissed', 'all'];
const REASON_LABELS = {
  spam: 'Spam or duplicate',
  misleading: 'Misleading information',
  inappropriate: 'Inappropriate content',
  fraud: 'Fraud or scam',
  other: 'Other issue'
};

export default function AdminReportsPage() {
  usePageMeta('Reports', 'Review reports about listings, members and reviews.');
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('open');
  const [acting, setActing] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    api
      .get(`/admin/reports?${params.toString()}`)
      .then(({ data }) => {
        setItems(data.items);
        setError('');
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const resolve = async (event) => {
    event.preventDefault();
    if (!acting) return;
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/reports/${acting.report._id}`, {
        status: acting.status,
        adminNote: note.trim()
      });
      setItems((current) => current.map((item) => (item._id === data.report._id ? { ...item, ...data.report } : item)));
      if (status !== 'all' && data.report.status !== status) {
        setItems((current) => current.filter((item) => item._id !== data.report._id));
      }
      toast.success(`Report ${acting.status}.`);
      setActing(null);
      setNote('');
    } catch (actionError) {
      toast.error(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Reports</h2>
          <p>Investigate flagged listings and members. Record an internal note for other admins.</p>
        </div>
      </div>

      <div className="tabs">
        {FILTERS.map((value) => (
          <button type="button" key={value} className={`tab ${status === value ? 'active' : ''}`} onClick={() => setStatus(value)}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <PageLoading />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Flag}
          title={status === 'open' ? 'No open reports' : 'No reports found'}
          description={status === 'open' ? 'Nothing needs moderation right now.' : 'Try another status filter.'}
        />
      ) : (
        <div className="report-list">
          {items.map((report) => (
            <article className="report-card" key={report._id}>
              <div className="report-head">
                <div className="row" style={{ gap: 8 }}>
                  <span className="report-icon"><Flag size={16} /></span>
                  <div>
                    <h3>{REASON_LABELS[report.reason] || report.reason}</h3>
                    <p className="small muted">
                      {report.targetType} · reported by {report.reporter?.name || 'deleted member'}
                      {report.reporter?.email ? ` (${report.reporter.email})` : ''} · {timeAgo(report.createdAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={report.status} />
              </div>
              {report.details && <p className="report-details">{report.details}</p>}
              <div className="report-target">
                <span>Target: <strong>{report.targetName}</strong></span>
                {report.targetLink && <Link to={report.targetLink} className="link-arrow">Open <ExternalLink size={13} /></Link>}
              </div>
              {report.adminNote && <p className="small muted">Admin note: {report.adminNote}</p>}
              <div className="report-actions">
                <span className="small muted">Created {formatDate(report.createdAt)}</span>
                {report.status === 'open' && (
                  <>
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => { setActing({ report, status: 'reviewed' }); setNote(report.adminNote || ''); }}>
                      <CheckCircle2 size={13} /> Mark reviewed
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => { setActing({ report, status: 'dismissed' }); setNote(report.adminNote || ''); }}>
                      <XCircle size={13} /> Dismiss
                    </button>
                  </>
                )}
                {report.status !== 'open' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setActing({ report, status: 'open' }); setNote(report.adminNote || ''); }}>
                    Reopen
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(acting)}
        onClose={() => (busy ? null : setActing(null))}
        title={acting?.status === 'reviewed' ? 'Mark report reviewed' : acting?.status === 'dismissed' ? 'Dismiss report' : 'Reopen report'}
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setActing(null)} disabled={busy}>Cancel</button>
            <button type="submit" form="resolve-report-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save decision'}
            </button>
          </>
        )}
      >
        <form id="resolve-report-form" className="stack" onSubmit={resolve}>
          <p className="muted small">Report: <strong>{REASON_LABELS[acting?.report.reason] || acting?.report.reason}</strong> — {acting?.report.targetName}</p>
          <div className="field">
            <label htmlFor="admin-note">Internal admin note</label>
            <textarea id="admin-note" className="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Optional context for other administrators. Not shown publicly." />
          </div>
        </form>
      </Modal>
    </>
  );
}
