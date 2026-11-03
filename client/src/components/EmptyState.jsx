import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction, children }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-icon">
          <Icon size={25} />
        </span>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  );
}
