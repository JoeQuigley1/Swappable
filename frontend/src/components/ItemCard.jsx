import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../api/config.js';
import { CONDITION_COLORS } from '../lib/constants.js';

export default function ItemCard({ item }) {
  const {
    id,
    title,
    description,
    category,
    condition,
    owner,
    location,
    imageUrl,
  } = item;
  const badgeColor = CONDITION_COLORS[condition] ?? 'secondary';
  const navigate = useNavigate();

  // title and image open the item detail page
  const openDetail = () => navigate(`/items/${id}`);

  // request swap: not logged in -> login page. logged in -> item detail,
  // where the actual offer-item / message form lives.
  const handleRequestSwap = () => {
      if (!localStorage.getItem('token')) {
        navigate('/login')
        return
      }
      navigate(`/items/${id}`)
   }

  // placeholders: the click targets exist now so they can be wired up later.
  const handleCategoryClick = () => {}; // TODO: filter items by this category
  const handleLocationClick = () => {}; // TODO: filter items by this location
  const handleOwnerClick = () => {}; // TODO: open this owner's public listings
  return (
    <div className="card h-100">
      {imageUrl ? (
        <img
          src={resolveImageUrl(imageUrl)}
          alt={title}
          className="card-img-top clickable"
          style={{ height: '180px', objectFit: 'cover' }}
          role="button"
          onClick={openDetail}
        />
      ) : (
        <div
          className="bg-light d-flex align-items-center justify-content-center clickable"
          style={{ height: '180px' }}
          role="button"
          onClick={openDetail}
        >
          <i
            className="bi bi-image text-muted"
            style={{ fontSize: '3rem' }}
          ></i>
        </div>
      )}
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6
            className="card-title fw-semibold mb-0 clickable"
            role="button"
            onClick={openDetail}
          >
            {title}
          </h6>
          <span className={`badge bg-${badgeColor} ms-2 text-nowrap`}>
            {condition}
          </span>
        </div>
        <span
          className="badge bg-light text-secondary border mb-2 align-self-start clickable"
          role="button"
          onClick={handleCategoryClick}
        >
          {category}
        </span>
        <p className="card-text text-muted small flex-grow-1">{description}</p>
        <div className="d-flex justify-content-between align-items-center mt-2 small text-muted">
          <span className="clickable" role="button" onClick={handleOwnerClick}>
            <i className="bi bi-person me-1"></i>
            {owner}
          </span>
          <span
            className="clickable"
            role="button"
            onClick={handleLocationClick}
          >
            <i className="bi bi-geo-alt me-1"></i>
            {location}
          </span>
        </div>
      </div>
      <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 px-3">
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm w-50"
            onClick={openDetail}
          >
            <i className="bi bi-eye me-1"></i>
            View Item
          </button>
          <button className="btn btn-primary btn-sm w-50" onClick={handleRequestSwap}>
            <i className="bi bi-arrow-left-right me-1"></i>
            Request Swap
          </button>
        </div>
      </div>
    </div>
  );
}
