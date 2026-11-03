import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { settingsPath } from '../utils/format';

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo light />
            <p>
              Find your stay. Find your people. StayMate brings accommodation, compatible roommates
              and reliable food services together for students and working professionals.
            </p>
            <span className="footer-badge">
              <ShieldCheck size={13} /> Listings reviewed by moderators
            </span>
          </div>
          <div>
            <h4>Explore</h4>
            <div className="footer-links">
              <Link to="/accommodations">Find accommodation</Link>
              <Link to="/roommates">Find roommates</Link>
              <Link to="/food">Food & tiffin</Link>
              <Link to="/about">About StayMate</Link>
            </div>
          </div>
          <div>
            <h4>For providers</h4>
            <div className="footer-links">
              <Link to="/list-your-property">List your property</Link>
              <Link to="/signup?role=owner">Property owner sign up</Link>
              <Link to="/signup?role=food_provider">Food provider sign up</Link>
              <Link to="/login">Provider login</Link>
            </div>
          </div>
          <div>
            <h4>Support</h4>
            <div className="footer-links">
              <a href="mailto:hello@staymate.app">hello@staymate.app</a>
              <Link to="/about#faq">Frequently asked questions</Link>
              <Link to="/about#trust">Trust & safety</Link>
              <Link to={user ? settingsPath(user.role) : '/login'}>Account settings</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} StayMate. Built for students and professionals finding a new city to call home.</span>
          <div className="footer-bottom-links">
            <Link to="/about">About</Link>
            <Link to="/list-your-property">List a property</Link>
            <a href="mailto:hello@staymate.app">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
