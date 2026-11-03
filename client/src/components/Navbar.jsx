import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, PlusCircle, LayoutDashboard } from 'lucide-react';
import Logo from './Logo';
import NotificationBell, { UserMenu } from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { roleHome, settingsPath } from '../utils/format';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/accommodations', label: 'Find Accommodation' },
  { to: '/roommates', label: 'Find Roommates' },
  { to: '/food', label: 'Food & Tiffin' },
  { to: '/about', label: 'About Us' }
];

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="navbar-wrap">
      <div className="container navbar">
        <Logo />
        <nav className="navbar-links" aria-label="Main navigation">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="navbar-actions">
          <Link to="/list-your-property" className="btn btn-ghost hide-mobile">
            <PlusCircle size={15} /> List Your Property
          </Link>
          {user ? (
            <>
              <Link to={roleHome(user.role)} className="btn btn-outline hide-mobile">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/signup" className="btn btn-dark hide-mobile">
                Sign Up
              </Link>
            </>
          )}
          <button
            type="button"
            className="icon-btn mobile-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-drawer">
          <nav className="nav-drawer-links" aria-label="Mobile navigation">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {link.label}
              </NavLink>
            ))}
            <Link to="/list-your-property">List Your Property</Link>
          </nav>
          <div className="nav-drawer-actions">
            {user ? (
              <>
                <Link to={roleHome(user.role)} className="btn btn-outline btn-sm">
                  Dashboard
                </Link>
                <Link to={settingsPath(user.role)} className="btn btn-soft btn-sm">
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-dark btn-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
