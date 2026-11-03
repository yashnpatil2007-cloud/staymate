import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SaveButton({ listingType, listingId, initialSaved = false, onChange, label = 'Save listing' }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const toggle = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast.info('Log in to save listings to your account.');
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.post('/saved/toggle', { listingType, listingId });
      setSaved(data.saved);
      onChange?.(data.saved);
      toast.success(data.saved ? 'Saved to your account.' : 'Removed from saved listings.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`save-btn ${saved ? 'is-saved' : ''}`}
      onClick={toggle}
      aria-label={saved ? 'Remove from saved listings' : label}
      aria-pressed={saved}
      disabled={loading}
    >
      <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
