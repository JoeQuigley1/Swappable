import { useEffect, useState } from 'react';
import HeroSection from '../components/HeroSection.jsx';
import ItemCard from '../components/ItemCard.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import HowItWorksSection from '../components/HowItWorksSection.jsx';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../lib/constants.js';
import {API_BASE_URL} from "../api/config.js";

// map a backend item (ItemResponse) onto the shape ItemCard expects
function toCardItem(item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.categoryName,
    condition: item.condition,
    owner: item.ownerUsername,
    location: item.ownerLocation,
    imageUrl: item.imageUrl,
  };
}

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/items`)
      .then((res) => res.json())
      .then((data) => setItems(data.content ?? []))
      .catch(() => setItems([]));

    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // live count of items per category name so each card shows a real total
  const itemsByCategory = items.reduce((acc, item) => {
    acc[item.categoryName] = (acc[item.categoryName] ?? 0) + 1;
    return acc;
  }, {});

  // show the six most recently listed items (highest id first)
  const featuredItems = [...items]
    .sort((a, b) => b.id - a.id)
    .slice(0, 6)
    .map(toCardItem);

  return (
    <>
      <HeroSection itemCount={items.length} />

      <section className="py-5">
        <div className="container">
          <div className="mb-4">
            <h2 className="fw-bold mb-1">Browse by Category</h2>
            <p className="text-muted mb-0">
              Find exactly what you&apos;re looking for
            </p>
          </div>
          <div className="row row-cols-2 row-cols-sm-4 row-cols-lg-8 g-3">
            {categories.map((cat) => (
              <div key={cat.id} className="col">
                <CategoryCard
                  category={{
                    name: cat.name,
                    icon: CATEGORY_ICONS[cat.name] ?? DEFAULT_CATEGORY_ICON,
                    count: itemsByCategory[cat.name] ?? 0,
                  }}
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
