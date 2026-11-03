import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;

  const numbers = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let index = Math.max(1, Math.min(start, pages - 4)); index <= end; index += 1) {
    numbers.push(index);
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="page-btn"
        disabled={!pagination.hasPrev}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {numbers[0] > 1 && (
        <>
          <button type="button" className="page-btn" onClick={() => onChange(1)}>
            1
          </button>
          {numbers[0] > 2 && <span className="muted small">…</span>}
        </>
      )}
      {numbers.map((number) => (
        <button
          key={number}
          type="button"
          className={`page-btn ${number === page ? 'active' : ''}`}
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
        >
          {number}
        </button>
      ))}
      {numbers[numbers.length - 1] < pages && (
        <>
          {numbers[numbers.length - 1] < pages - 1 && <span className="muted small">…</span>}
          <button type="button" className="page-btn" onClick={() => onChange(pages)}>
            {pages}
          </button>
        </>
      )}
      <button
        type="button"
        className="page-btn"
        disabled={!pagination.hasNext}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
