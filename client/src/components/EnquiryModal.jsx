import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import api from '../api/client';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function EnquiryModal({ listingType, listingId, listingName, onClose, onSent }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: `Hi, I'm interested in ${listingName}. Could you share more details about availability and the next steps?`
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.message.trim().length < 10) {
      setError('Please write at least 10 characters about what you need.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/enquiries', {
        listingType,
        listingId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message
      });
      setSent(true);
      toast.success('Enquiry sent to the provider.');
      onSent?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Modal
        title="Enquiry sent"
        onClose={onClose}
        footer={
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        }
      >
        <div className="empty-state" style={{ border: 0, padding: '20px 0 8px' }}>
          <span className="empty-icon">
            <CheckCircle2 size={26} />
          </span>
          <h3>Your enquiry is with the provider</h3>
          <p>
            You will receive a StayMate notification when the provider marks your enquiry as
            contacted. After that, you can leave a verified review.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Contact provider"
      description={`Send an enquiry about ${listingName}. Your contact details are shared only with this provider.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="enquiry-form" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending…' : (
              <>
                <Send size={15} /> Send enquiry
              </>
            )}
          </button>
        </>
      }
    >
      <form id="enquiry-form" className="stack" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="enquiry-name">Your name</label>
            <input id="enquiry-name" className="input" value={form.name} onChange={update('name')} required maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="enquiry-phone">Phone</label>
            <input id="enquiry-phone" className="input" value={form.phone} onChange={update('phone')} maxLength={20} placeholder="Optional" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="enquiry-email">Email</label>
          <input id="enquiry-email" type="email" className="input" value={form.email} onChange={update('email')} required />
        </div>
        <div className="field">
          <label htmlFor="enquiry-message">Message</label>
          <textarea id="enquiry-message" className="textarea" value={form.message} onChange={update('message')} required minLength={10} maxLength={1500} />
          <span className="field-hint">{form.message.length}/1500 characters</span>
        </div>
      </form>
    </Modal>
  );
}
