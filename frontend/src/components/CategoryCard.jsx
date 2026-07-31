export default function CategoryCard({ category, onSelect }) {
  const { name, icon, count } = category

  // the card is a button in all but markup, so it has to answer the keyboard too
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.()
    }
  }

  return (
    <div
      className="card text-center h-100 category-card border-0 shadow-sm"
      role="button"
      tabIndex={0}
      aria-label={`Browse ${name} items`}
      onClick={() => onSelect?.()}
      onKeyDown={handleKeyDown}
    >
      <div className="card-body py-4">
        <i className={`bi ${icon} text-primary mb-3 d-block`} style={{ fontSize: '2rem' }}></i>
        <h6 className="card-title fw-semibold mb-1">{name}</h6>
        <p className="text-muted small mb-0">{count} items</p>
      </div>
    </div>
  )
}
