const CONDITION_COLORS = {
  'Like New': 'success',
  Good: 'primary',
  Fair: 'warning',
  Poor: 'danger',
}

export default function ItemCard({ item }) {
  const { title, description, category, condition, owner, location } = item
  const badgeColor = CONDITION_COLORS[condition] ?? 'secondary'

  return (
    <div className="card h-100 shadow-sm">
      <div
        className="bg-light d-flex align-items-center justify-content-center"
        style={{ height: '180px' }}
      >
        <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
      </div>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6 className="card-title fw-semibold mb-0">{title}</h6>
          <span className={`badge bg-${badgeColor} ms-2 text-nowrap`}>{condition}</span>
        </div>
        <span className="badge bg-light text-secondary border mb-2 align-self-start">
          {category}
        </span>
        <p className="card-text text-muted small flex-grow-1">{description}</p>
        <div className="d-flex justify-content-between align-items-center mt-2 small text-muted">
          <span>
            <i className="bi bi-person me-1"></i>
            {owner}
          </span>
          <span>
            <i className="bi bi-geo-alt me-1"></i>
            {location}
          </span>
        </div>
      </div>
      <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 px-3">
        <button className="btn btn-primary btn-sm w-100">
          <i className="bi bi-arrow-left-right me-1"></i>
          Request Swap
        </button>
      </div>
    </div>
  )
}
