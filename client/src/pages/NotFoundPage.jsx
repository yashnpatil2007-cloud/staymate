import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Home, Search } from 'lucide-react';
import usePageMeta from '../hooks/usePageMeta';

export default function NotFoundPage() {
  usePageMeta('Page not found', 'The page you are looking for does not exist.');
  return (
    <div className="page page-top">
      <div className="container">
        <div className="not-found">
          <span className="not-found-code">404</span>
          <span className="empty-icon"><Compass size={26} /></span>
          <h1 className="display">This page took a wrong turn.</h1>
          <p>
            The page you are looking for may have moved, been removed, or never existed. Try one of
            these instead.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={16} /> Go home
            </Link>
            <Link to="/accommodations" className="btn btn-outline">
              <Search size={16} /> Find accommodation
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => window.history.back()}>
              <ArrowLeft size={16} /> Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
