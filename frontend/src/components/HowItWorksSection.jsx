import { howItWorksSteps } from '../lib/mockData.js'

export default function HowItWorksSection() {
  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold">How It Works</h2>
          <p className="text-muted">Swapping is simple. Here&apos;s how to get started.</p>
        </div>
        <div className="row g-4 justify-content-center">
          {howItWorksSteps.map((step) => (
            <div key={step.step} className="col-md-4 text-center">
              <div className="mb-3 position-relative d-inline-block">
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto"
                  style={{ width: '72px', height: '72px' }}
                >
                  <i className={`bi ${step.icon}`} style={{ fontSize: '1.75rem' }}></i>
                </div>
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark fw-bold"
                  style={{ fontSize: '0.75rem' }}
                >
                  {step.step}
                </span>
              </div>
              <h5 className="fw-semibold">{step.title}</h5>
              <p className="text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
