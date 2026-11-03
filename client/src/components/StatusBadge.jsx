const LABELS = {
  pending: 'Pending review',
  approved: 'Live',
  rejected: 'Rejected',
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
  accepted: 'Accepted',
  cancelled: 'Cancelled',
  open: 'Open',
  reviewed: 'Reviewed',
  dismissed: 'Dismissed',
  hidden: 'Hidden'
};

const CLASSES = {
  approved: 'badge-teal',
  contacted: 'badge-info',
  accepted: 'badge-teal',
  pending: 'badge-amber',
  new: 'badge-amber',
  open: 'badge-amber',
  rejected: 'badge-danger',
  hidden: 'badge-danger',
  dismissed: 'badge-danger',
  closed: 'badge',
  cancelled: 'badge',
  reviewed: 'badge-info'
};

export default function StatusBadge({ status, dot = true }) {
  return (
    <span className={`badge ${CLASSES[status] || ''}`}>
      {dot && <span className={`status-dot ${status}`} />}
      {LABELS[status] || status}
    </span>
  );
}
