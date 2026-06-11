import ItemCard from './ItemCard.jsx'

// responsive grid of item cards with an empty state.
// grid columns mirror the Featured Items section on the home page.
export default function ItemGrid({ items }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-search text-muted d-block mb-3" style={{ fontSize: '2.5rem' }}></i>
        <h5 className="fw-semibold">No items found</h5>
        <p className="text-muted mb-0">Try adjusting your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
      {items.map((item) => (
        <div key={item.id} className="col">
          <ItemCard item={item} />
        </div>
      ))}
    </div>
  )
}
