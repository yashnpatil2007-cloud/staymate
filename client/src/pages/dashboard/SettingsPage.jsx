import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, KeyRound, LockKeyhole, Save, ShieldCheck, UserRound } from 'lucide-react';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ImageUploader from '../../components/ImageUploader';
import Avatar from '../../components/Avatar';
import { ROLE_LABELS } from '../../utils/format';

export default function SettingsPage() {
  usePageMeta('Account Settings', 'Update your StayMate profile and password.');
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const notificationsPath =
    user?.role === 'admin' ? '/admin/notifications'
      : user?.role === 'owner' ? '/owner/notifications'
        : user?.role === 'food_provider' ? '/provider/notifications'
          : '/dashboard/notifications';

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', profile);
      updateUser(data.user);
      toast.success('Profile updated.');
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (passwords.newPassword !== passwords.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (
      passwords.newPassword.length < 8 ||
      !/[A-Za-z]/.test(passwords.newPassword) ||
      !/[0-9]/.test(passwords.newPassword)
    ) {
      setPasswordError('Use at least 8 characters with at least one letter and one number.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password changed. Please log in again.');
      updateUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <div>
          <h2>Account settings</h2>
          <p>Keep your contact details and password up to date.</p>
        </div>
        <Link to={notificationsPath} className="btn btn-outline btn-sm"><Bell size={14} /> Notifications</Link>
      </div>

      <div className="settings-grid">
        <form className="panel stack" onSubmit={saveProfile}>
          <div className="panel-head" style={{ marginBottom: 4 }}>
            <div>
              <h3><UserRound size={17} /> Profile</h3>
              <p>This information appears on your listings and roommate profile.</p>
            </div>
          </div>
          {profileError && <div className="alert alert-error">{profileError}</div>}
          <div className="settings-avatar-row">
            <Avatar src={profile.avatar} name={profile.name} size="lg" />
            <div>
              <strong>{profile.name || 'Your name'}</strong>
              <span>{ROLE_LABELS[user?.role] || 'StayMate member'}</span>
            </div>
          </div>
          <ImageUploader
            value={profile.avatar ? [profile.avatar] : []}
            onChange={(images) => setProfile({ ...profile, avatar: images[0] || '' })}
            single
            label="Profile photo"
          />
          <div className="form-grid">
            <div className="field">
              <label htmlFor="settings-name">Full name</label>
              <input id="settings-name" className="input" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required minLength={2} maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="settings-phone">Phone</label>
              <input id="settings-phone" className="input" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} maxLength={20} placeholder="Optional" />
            </div>
            <div className="field">
              <label htmlFor="settings-city">City</label>
              <input id="settings-city" className="input" value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} maxLength={80} placeholder="Optional" />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={user?.email || ''} disabled />
              <span className="field-hint">Email cannot be changed from this panel.</span>
            </div>
            <div className="field form-full">
              <label htmlFor="settings-bio">Short bio</label>
              <textarea id="settings-bio" className="textarea" rows={3} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} maxLength={500} placeholder="A short introduction, used on your profile." />
              <span className="field-hint">{profile.bio.length}/500 characters</span>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
              <Save size={15} /> {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        <div className="dash-stack">
          <form className="panel stack" onSubmit={changePassword}>
            <div className="panel-head" style={{ marginBottom: 4 }}>
              <div>
                <h3><KeyRound size={17} /> Password</h3>
                <p>Changing your password signs you out of this session.</p>
              </div>
            </div>
            {passwordError && <div className="alert alert-error">{passwordError}</div>}
            <div className="field">
              <label htmlFor="current-password">Current password</label>
              <input id="current-password" type="password" className="input" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" className="input" autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required minLength={8} />
              <span className="field-hint">At least 8 characters, including a letter and a number.</span>
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" className="input" autoComplete="new-password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} required />
            </div>
            <button type="submit" className="btn btn-dark" disabled={passwordSaving}>
              <LockKeyhole size={15} /> {passwordSaving ? 'Updating…' : 'Change password'}
            </button>
          </form>

          <div className="panel">
            <div className="panel-head" style={{ marginBottom: 10 }}>
              <h3><ShieldCheck size={17} /> Account</h3>
            </div>
            <div className="price-rows" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
              <div className="price-row"><span>Role</span><strong>{ROLE_LABELS[user?.role] || user?.role}</strong></div>
              <div className="price-row"><span>Email</span><strong>{user?.email}</strong></div>
              <div className="price-row"><span>Account status</span><strong>Active</strong></div>
            </div>
            <div className="alert alert-info" style={{ marginTop: 14 }}>
              <ShieldCheck size={16} />
              <span className="small">Never share your password or OTPs with an owner, provider or anyone claiming to be from StayMate.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
