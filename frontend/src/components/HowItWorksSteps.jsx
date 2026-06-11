import { howItWorksDetailedSteps as steps } from '../lib/mockData.js'

// numbered circle + badge styling mirrors HowItWorksSection for consistency.
export default function HowItWorksSteps() {
  return (
    <section className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-1">Three Steps to Your Next Swap</h2>
          <p className="text-muted mb-0">Simple from start to finish</p>
        </div>
        <div className="row g-4">
          {steps.map((s) => (
            <div key={s.step} className="col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="mb-3 position-relative d-inline-block">
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '72px', height: '72px' }}
                    >
                      <i className={`bi ${s.icon}`} style={{ fontSize: '1.75rem' }}></i>
                    </div>
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark fw-bold"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {s.step}
                    </span>
                  </div>
                  <h5 className="fw-semibold">{s.title}</h5>
                  <p className="text-muted">{s.description}</p>
                  <ul className="list-unstyled small mb-0">
                    {s.points.map((p) => (
                      <li key={p} className="mb-1">
                        <i className="bi bi-check-circle-fill text-primary me-2"></i>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
