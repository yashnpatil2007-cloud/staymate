import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false, className = '' }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo-light' : ''} ${className}`} aria-label="StayMate home">
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 12.5 12 5l8 7.5V20a1.5 1.5 0 0 1-1.5 1.5H14V14h-4v7.5H5.5A1.5 1.5 0 0 1 4 20v-7.5Z"
            fill="currentColor"
          />
          <circle cx="17.5" cy="6" r="2.2" fill="#F0B544" />
        </svg>
      </span>
      <span>StayMate</span>
    </Link>
  );
}
