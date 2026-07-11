import { howItWorksFaqs as faqs } from '../lib/mockData.js'

// rendered as a Bootstrap accordion.
// bootstrap.bundle JS is imported globally in main.jsx so collapse works.
export default function HowItWorksFAQ() {
  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-1">Frequently Asked Questions</h2>
          <p className="text-muted mb-0">Everything else you might be wondering</p>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="accordion" id="howItWorksFaq">
              {faqs.map((item, i) => (
                <div className="accordion-item border-0 shadow-sm mb-3 rounded" key={item.q}>
                  <h2 className="accordion-header">
                    <button
                      className="accordion-button collapsed fw-semibold rounded"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#faq-${i}`}
                      aria-expanded="false"
                      aria-controls={`faq-${i}`}
                    >
                      {item.q}
                    </button>
                  </h2>
                  <div
                    id={`faq-${i}`}
                    className="accordion-collapse collapse"
                    data-bs-parent="#howItWorksFaq"
                  >
                    <div className="accordion-body text-muted">{item.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
