import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import Logo from '../../components/Logo';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import usePageMeta from '../../hooks/usePageMeta';

export default function ResetPasswordPage() {
  usePageMeta('Set a new password', 'Choose a new password for your StayMate account.');
  const { token: routeToken } = useParams();
  const [params] = useSearchParams();
  const token = routeToken || params.get('token') || '';
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Use at least 8 characters with at least one letter and one number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: form.password });
      toast.success(data.message || 'Password reset successfully.');
      navigate('/login', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="auth-card">
        <Logo />
        <h1>Set a new password</h1>
        <p className="auth-sub">Choose a strong password you have not used before.</p>
        {!token ? (
          <div className="stack" style={{ marginTop: 24 }}>
            <div className="alert alert-error">
              This reset link is missing its token. Request a new password reset email.
            </div>
            <Link to="/forgot-password" className="btn btn-primary btn-block">
              Request a new link
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="field">
              <label htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                type="password"
                className="input"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                minLength={8}
              />
              <span className="field-hint">At least 8 characters, including a letter and a number.</span>
            </div>
            <div className="field">
              <label htmlFor="reset-confirm">Confirm new password</label>
              <input
                id="reset-confirm"
                type="password"
                className="input"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Updating…' : (
                <>
                  <KeyRound size={16} /> Reset password
                </>
              )}
            </button>
            <Link to="/login" className="btn btn-ghost btn-block">Back to login</Link>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
