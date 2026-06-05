import HeroSection from '../components/HeroSection.jsx'
import ItemCard from '../components/ItemCard.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import HowItWorksSection from '../components/HowItWorksSection.jsx'
import { featuredItems, categories } from '../lib/mockData.js'

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section className="py-5">
        <div className="container">
          <div className="mb-4">
            <h2 className="fw-bold mb-1">Browse by Category</h2>
            <p className="text-muted mb-0">Find exactly what you&apos;re looking for</p>
          </div>
          <div className="row row-cols-2 row-cols-sm-4 row-cols-lg-8 g-3">
            {categories.map((cat) => (
              <div key={cat.id} className="col">
                <CategoryCard category={cat} />
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
              <p className="text-muted mb-0">Recently listed and ready to swap</p>
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
  )
}
