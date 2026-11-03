import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Flag,
  Handshake,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Settings,
  Star,
  Users,
  UtensilsCrossed,
  Globe,
  X
} from 'lucide-react';
import Logo from './Logo';
import NotificationBell, { UserMenu } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';

const NAV = {
  customer: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/saved', label: 'Saved listings', icon: Heart },
    { to: '/dashboard/requests', label: 'Roommate requests', icon: Users },
    { to: '/dashboard/connections', label: 'Connections', icon: Handshake },
    { to: '/dashboard/enquiries', label: 'My enquiries', icon: MessageSquare },
    { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { to: '/dashboard/settings', label: 'Account settings', icon: Settings }
  ],
  owner: [
    { to: '/owner', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/owner/listings', label: 'My listings', icon: Building2 },
    { to: '/owner/listings/new', label: 'Add a property', icon: PlusCircle },
    { to: '/owner/enquiries', label: 'Enquiries', icon: MessageSquare },
    { to: '/owner/notifications', label: 'Notifications', icon: Bell },
    { to: '/owner/settings', label: 'Account settings', icon: Settings }
  ],
  food_provider: [
    { to: '/provider', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/provider/listings', label: 'My food listings', icon: UtensilsCrossed },
    { to: '/provider/listings/new', label: 'Add a food listing', icon: PlusCircle },
    { to: '/provider/enquiries', label: 'Enquiries', icon: MessageSquare },
    { to: '/provider/notifications', label: 'Notifications', icon: Bell },
    { to: '/provider/settings', label: 'Account settings', icon: Settings }
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/listings', label: 'Property listings', icon: Building2 },
    { to: '/admin/food', label: 'Food listings', icon: UtensilsCrossed },
    { to: '/admin/reports', label: 'Reports', icon: Flag },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Account settings', icon: Settings }
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = NAV[user?.role] || NAV.customer;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const current = useMemo(() => {
    const matches = links.filter((link) =>
      link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)
    );
    return matches.sort((a, b) => b.to.length - a.to.length)[0];
  }, [links, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dash-shell">
      {open && <div className="dash-sidebar-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`dash-sidebar ${open ? 'open' : ''}`}>
        <div className="dash-sidebar-head">
          <Logo />
          <span className="dash-sidebar-role">{ROLE_LABELS[user?.role] || 'Dashboard'}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            style={{ position: 'absolute', top: 18, right: 14 }}
          >
            <X size={16} />
          </button>
        </div>
        <nav className="dash-nav" aria-label="Dashboard navigation">
          <p className="dash-nav-label">Workspace</p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="dash-sidebar-foot">
          <Link to="/" className="dash-nav-link" style={{ marginBottom: 6 }}>
            <Globe size={16} /> Back to website
          </Link>
          <button type="button" className="dash-nav-link" style={{ width: '100%', border: 0, background: 'none' }} onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="row" style={{ gap: 10 }}>
            <button
              type="button"
              className="icon-btn dash-mobile-toggle"
              onClick={() => setOpen(true)}
              aria-label="Open dashboard menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1>{current?.label || 'Dashboard'}</h1>
              <p>{ROLE_LABELS[user?.role]} workspace</p>
            </div>
          </div>
          <div className="dash-topbar-actions">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
