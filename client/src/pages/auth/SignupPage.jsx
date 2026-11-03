import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, UserRound, UtensilsCrossed, UserPlus } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { roleHome } from '../../utils/format';
import usePageMeta from '../../hooks/usePageMeta';

const ROLES = [
  { value: 'customer', label: 'Customer', hint: 'Find a stay', icon: UserRound },
  { value: 'owner', label: 'Property owner', hint: 'List a property', icon: Building2 },
  { value: 'food_provider', label: 'Food provider', hint: 'List meals', icon: UtensilsCrossed }
];

export default function SignupPage() {
  usePageMeta('Create an account', 'Join StayMate as a customer, property owner or food service provider.');
  const { user, loading, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = ['customer', 'owner', 'food_provider'].includes(params.get('role'))
    ? params.get('role')
    : 'customer';
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    city: '',
    role: initialRole
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextParam = params.get('next');
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

  if (!loading && user) return <Navigate to={next || roleHome(user.role)} replace />;

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
    setSubmitting(true);
    try {
      const created = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        city: form.city
      });
      toast.success('Account created. Welcome to StayMate.');
      navigate(next || roleHome(created.role), { replace: true });
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="auth-card">
        <Logo />
        <h1>Create your account</h1>
        <p className="auth-sub">Choose how you want to use StayMate. You can explore before adding listings.</p>
        <form className="auth-form" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label>I am joining as</label>
            <div className="role-picker" role="radiogroup" aria-label="Account type">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    type="button"
                    key={role.value}
                    role="radio"
                    aria-checked={form.role === role.value}
                    className={`role-option ${form.role === role.value ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, role: role.value })}
                  >
                    <Icon size={17} />
                    <strong>{role.label}</strong>
                    <span>{role.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              className="input"
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              minLength={2}
            />
          </div>
          <div className="field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              className="input"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="signup-phone">Phone <span className="muted">(optional)</span></label>
              <input
                id="signup-phone"
                className="input"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={20}
              />
            </div>
            <div className="field">
              <label htmlFor="signup-city">City <span className="muted">(optional)</span></label>
              <input
                id="signup-city"
                className="input"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                maxLength={80}
              />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
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
              <label htmlFor="signup-confirm">Confirm password</label>
              <input
                id="signup-confirm"
                type="password"
                className="input"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Creating account…' : (
              <>
                <UserPlus size={16} /> Create account
              </>
            )}
          </button>
          <p className="field-hint">
            Listings from property and food providers are reviewed by a StayMate moderator before
            they appear publicly.
          </p>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
