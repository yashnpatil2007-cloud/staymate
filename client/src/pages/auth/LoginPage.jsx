import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { roleHome } from '../../utils/format';
import usePageMeta from '../../hooks/usePageMeta';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.DEV;
const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'customer@staymate.app', password: 'Demo1234!' },
  { role: 'Owner', email: 'owner@staymate.app', password: 'Demo1234!' },
  { role: 'Food provider', email: 'provider@staymate.app', password: 'Demo1234!' },
  { role: 'Admin', email: 'admin@staymate.app', password: 'ChangeMe123!' }
];

export default function LoginPage() {
  usePageMeta('Log in', 'Log in to manage your StayMate saved listings, roommate requests and enquiries.');
  const { user, loading, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextParam = params.get('next');
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

  if (!loading && user) {
    return <Navigate to={next || roleHome(user.role)} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login(form);
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}.`);
      navigate(next || roleHome(loggedIn.role), { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="auth-card">
        <Logo />
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to pick up where you left off.</p>
        <form className="auth-form" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              className="input"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                className="btn-link"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <div className="auth-links-row">
            <span className="muted small">Secure session with an httpOnly cookie.</span>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Logging in…' : (
              <>
                <LogIn size={16} /> Log in
              </>
            )}
          </button>
        </form>
        <p className="auth-footer">
          New to StayMate? <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link>
        </p>
        {DEMO_MODE && (
          <div className="demo-box">
            <h4>Local demo accounts</h4>
            {DEMO_ACCOUNTS.map((account) => (
              <div className="demo-account" key={account.email}>
                <span>
                  <strong>{account.role}</strong>
                  <br />
                  {account.email}
                </span>
                <button
                  type="button"
                  onClick={() => setForm({ email: account.email, password: account.password || 'Demo1234!' })}
                >
                  Use account
                </button>
              </div>
            ))}
            <p className="field-hint" style={{ marginTop: 6 }}>
              Demo data is clearly labelled inside the app. The administrator account uses the
              credentials configured in server/.env.
            </p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
