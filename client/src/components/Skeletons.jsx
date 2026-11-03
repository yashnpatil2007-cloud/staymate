export function ListingSkeletons({ count = 6 }) {
  return (
    <div className="listing-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton-image" />
          <div className="skeleton-lines">
            <div className="skeleton skeleton-line w-70" />
            <div className="skeleton skeleton-line w-45" />
            <div className="skeleton skeleton-line w-90" />
            <div className="skeleton skeleton-line w-45" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoommateSkeletons({ count = 6 }) {
  return (
    <div className="roommate-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index} style={{ padding: 20, borderRadius: 22 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%' }} />
            <div style={{ flex: 1 }} className="stack-sm">
              <div className="skeleton skeleton-line w-70" />
              <div className="skeleton skeleton-line w-45" />
            </div>
          </div>
          <div style={{ marginTop: 16 }} className="stack-sm">
            <div className="skeleton skeleton-line w-90" />
            <div className="skeleton skeleton-line w-70" />
            <div className="skeleton skeleton-line w-45" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="page-loading" role="status">
      <span className="loading-spinner-lg" />
      <span>Loading…</span>
    </div>
  );
}
