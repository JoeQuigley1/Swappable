import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection.jsx';
import ItemCard from '../components/ItemCard.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import HowItWorksSection from '../components/HowItWorksSection.jsx';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../lib/constants.js';
import {API_BASE_URL} from "../api/config.js";
import { toCardItem } from '../api/items.js';

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [totalItemCount, setTotalItemCount] = useState(0);
  const [categories, setCategories] = useState([]);
  // set by DeleteAccountPage after a successful account deletion
  const [accountDeleted, setAccountDeleted] = useState(
    Boolean(location.state?.accountDeleted)
  );

  // clear the redirect flag so a refresh or back navigation does not reshow
  // the banner, and auto-hide it after a few seconds
  useEffect(() => {
    if (!accountDeleted) return;
    window.history.replaceState({}, '');
    const timer = setTimeout(() => setAccountDeleted(false), 5000);
    return () => clearTimeout(timer);
  }, [accountDeleted]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/items?size=6&sort=createdAt,desc`)
      .then((res) => res.json())
      .then((data) => setFeaturedItems((data.content ?? []).map(toCardItem)))
      .catch(() => setFeaturedItems([]));

    fetch(`${API_BASE_URL}/items?size=1`)
      .then((res) => res.json())
      .then((data) => setTotalItemCount(data.totalElements ?? 0))
      .catch(() => setTotalItemCount(0));

    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);


  return (
    <>
      {accountDeleted && (
        <div
          className="position-fixed start-50 translate-middle-x px-3 w-100"
          style={{ top: '116px', zIndex: 1080, maxWidth: '600px' }}
        >
          <div className="alert alert-success alert-dismissible shadow fade show mb-0" role="alert">
            Your account has been deleted successfully.
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setAccountDeleted(false)}
            ></button>
          </div>
        </div>
      )}

      <HeroSection itemCount={totalItemCount} />

      <section className="py-5">
        <div className="container">
          <div className="mb-4">
            <h2 className="fw-bold mb-1">Browse by Category</h2>
            <p className="text-muted mb-0">
              Find exactly what you're looking for
            </p>
          </div>
          <div className="row row-cols-2 row-cols-sm-4 row-cols-lg-8 g-3">
            {categories.map((cat) => (
              <div key={cat.id} className="col">
                <CategoryCard
                  category={{
                    name: cat.name,
                    icon: CATEGORY_ICONS[cat.name] ?? DEFAULT_CATEGORY_ICON,
                    count: cat.itemCount ?? 0,
                  }}
                  onSelect={() =>
                    navigate(`/items?category=${encodeURIComponent(cat.name)}`)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Featured Items</h2>
              <p className="text-muted mb-0">
                Recently listed and ready to swap
              </p>
            </div>
            <a href="/items" className="btn btn-outline-primary btn-sm">
              View all <i className="bi bi-arrow-right ms-1"></i>
            </a>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            {featuredItems.map((item) => (
              <div key={item.id} className="col">
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorksSection />
    </>
  );
}
