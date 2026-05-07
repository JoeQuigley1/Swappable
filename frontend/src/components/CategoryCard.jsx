export default function CategoryCard({ category }) {
  const { name, icon, count } = category

  return (
    <div className="card text-center h-100 category-card border-0 shadow-sm">
      <div className="card-body py-4">
        <i className={`bi ${icon} text-primary mb-3 d-block`} style={{ fontSize: '2rem' }}></i>
        <h6 className="card-title fw-semibold mb-1">{name}</h6>
        <p className="text-muted small mb-0">{count} items</p>
      </div>
    </div>
  )
}
