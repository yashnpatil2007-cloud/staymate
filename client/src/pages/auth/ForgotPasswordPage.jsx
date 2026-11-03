import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import Logo from '../../components/Logo';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';

export default function ForgotPasswordPage() {
  usePageMeta('Forgot password', 'Request a StayMate password reset link.');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResult(data);
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
        <h1>Reset your password</h1>
        <p className="auth-sub">
          Enter the email on your account. If it exists, we will create a secure reset link that is
          valid for one hour.
        </p>
        {result ? (
          <div className="stack" style={{ marginTop: 24 }}>
            <div className="alert alert-success">
              <Mail size={17} />
              <div>
                <strong style={{ display: 'block', marginBottom: 3 }}>Request received</strong>
                {result.message}
              </div>
            </div>
            {result.devResetUrl && (
              <div className="alert alert-warning">
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>
                    Email delivery is not configured
                  </strong>
                  {result.note}
                  <div style={{ marginTop: 8 }}>
                    <a href={result.devResetUrl} className="btn btn-outline btn-sm">
                      Open development reset link
                    </a>
                  </div>
                </div>
              </div>
            )}
            <Link to="/login" className="btn btn-outline btn-block">
              Back to login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="field">
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                type="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Requesting…' : 'Create reset link'}
            </button>
            <Link to="/login" className="btn btn-ghost btn-block">
              <ArrowLeft size={15} /> Back to login
            </Link>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
