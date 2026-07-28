import { useNavigate } from 'react-router-dom'
import { CONDITION_COLORS } from '../lib/constants.js'
import {resolveImageUrl} from "../api/config.js";

// vertical list view of items, an alternative to the card grid
export default function ItemList({ items }) {
  const navigate = useNavigate()

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
    <div className="list-group shadow-sm">
      {items.map((item) => {
        const badgeColor = CONDITION_COLORS[item.condition] ?? 'secondary'
        return (
          <div
            key={item.id}
            className="list-group-item list-group-item-action d-flex align-items-center gap-3 clickable"
            role="button"
            onClick={() => navigate(`/items/${item.id}`)}
          >
            {item.imageUrl ? (
              <img
                src={resolveImageUrl(item.imageUrl)}
                alt={item.title}
                className="rounded flex-shrink-0"
                style={{ width: 64, height: 64, objectFit: 'cover' }}
              />
            ) : (
              <div
                className="bg-light d-flex align-items-center justify-content-center rounded flex-shrink-0"
                style={{ width: 64, height: 64 }}
              >
                <i className="bi bi-image text-muted" style={{ fontSize: '1.5rem' }}></i>
              </div>
            )}
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="fw-semibold mb-1">{item.title}</h6>
                <span className={`badge bg-${badgeColor} ms-2 text-nowrap`}>{item.condition}</span>
              </div>
              <p className="text-muted small mb-1 text-truncate">{item.description}</p>
              <span className="badge bg-light text-secondary border">{item.category}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
