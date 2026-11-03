import { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../api/client';
import Modal from './Modal';
import Avatar from './Avatar';
import { useToast } from '../context/ToastContext';

export default function RoommateRequestModal({ profile, onClose, onSent }) {
  const toast = useToast();
  const [message, setMessage] = useState(
    `Hi ${profile.user?.name?.split(' ')[0] || ''}, we seem to have similar preferences. Would you like to discuss looking for a place together?`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/roommates/requests', {
        toUserId: profile.user?.id,
        message
      });
      setSent(true);
      toast.success('Roommate request sent.');
      onSent?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={sent ? 'Request sent' : 'Send a roommate request'}
      description={
        sent
          ? undefined
          : `Your message goes to ${profile.user?.name || 'this person'}. Contact details stay private until they accept.`
      }
      onClose={onClose}
      footer={
        sent ? (
          <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
        ) : (
          <>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" form="roommate-request-form" className="btn btn-primary" disabled={loading}>
              <Send size={14} /> {loading ? 'Sending…' : 'Send request'}
            </button>
          </>
        )
      }
    >
      {sent ? (
        <p className="small muted" style={{ lineHeight: 1.7 }}>
          They can accept or decline from their dashboard. If they accept, you will be able to see
          each other’s contact details under Connections.
        </p>
      ) : (
        <form id="roommate-request-form" className="stack" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="owner-card" style={{ padding: '4px 0 8px' }}>
            <Avatar src={profile.user?.avatar} name={profile.user?.name} size="md" />
            <div className="owner-card-info">
              <h4>{profile.user?.name}</h4>
              <p>{profile.city}{profile.locality ? ` · ${profile.locality}` : ''}</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="roommate-request-message">Message</label>
            <textarea
              id="roommate-request-message"
              className="textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              placeholder="Introduce yourself and what you are looking for."
            />
            <span className="field-hint">{message.length}/500 characters</span>
          </div>
        </form>
      )}
    </Modal>
  );
}
