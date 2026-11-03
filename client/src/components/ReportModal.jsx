import { useState } from 'react';
import { Flag } from 'lucide-react';
import api from '../api/client';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';

const REASONS = [
  { value: 'spam', label: 'Spam or duplicate' },
  { value: 'misleading', label: 'Misleading information' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'fraud', label: 'Possible fraud' },
  { value: 'other', label: 'Other' }
];

export default function ReportModal({ targetType, targetId, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState('misleading');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/reports', { targetType, targetId, reason, details });
      setSent(true);
      toast.success('Report submitted for moderator review.');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={sent ? 'Report received' : 'Report this listing'}
      description={sent ? undefined : 'Our moderators will review this report. False reports may be ignored.'}
      onClose={onClose}
      footer={
        sent ? (
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" form="report-form" className="btn btn-danger" disabled={loading}>
              <Flag size={14} /> {loading ? 'Submitting…' : 'Submit report'}
            </button>
          </>
        )
      }
    >
      {sent ? (
        <p className="muted small" style={{ lineHeight: 1.7 }}>
          Thank you. You can track the resolution in your notifications if a moderator needs to
          follow up.
        </p>
      ) : (
        <form id="report-form" className="stack" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label htmlFor="report-reason">Reason</label>
            <select id="report-reason" className="select" value={reason} onChange={(event) => setReason(event.target.value)}>
              {REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="report-details">What should we know?</label>
            <textarea
              id="report-details"
              className="textarea"
              placeholder="Add details that will help our moderators review this report."
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
