import { useState, useEffect } from 'react'

// page for managing swap requests
function SwapRequests() {

  // list of received requests
  const [received, setReceived] = useState([])
  // list of sent requests
  const [sent, setSent] = useState([])
  // controls which tab is open right now
  const [tab, setTab] = useState('received')

  // load data when page opens
  // TODO: replace with real API calls
  useEffect(() => {
    setReceived([
      { id: 1, fromUser: 'johnfun2', offeredItem: 'Bicycle pump', wantedItem: 'Plant pot', status: 'PENDING' },
      { id: 2, fromUser: 'hannad', offeredItem: 'Cookbook', wantedItem: 'Yoga mat', status: 'PENDING' }
    ])
    setSent([
      { id: 3, toUser: 'brad99', offeredItem: 'Desk lamp', wantedItem: 'Headphones', status: 'PENDING' }
    ])
  }, [])

  // change status to ACCEPTED
  // TODO: replace with real API call
  const handleAccept = (id) => {
    console.log('Accepting swap:', id)
    setReceived(received.map(r => r.id === id ? { ...r, status: 'ACCEPTED' } : r))
  }

  // change status to DECLINED
  // TODO: replace with real API call
  const handleDecline = (id) => {
    console.log('Declining swap:', id)
    setReceived(received.map(r => r.id === id ? { ...r, status: 'DECLINED' } : r))
  }

  // pick badge colour based on status
  const statusBadge = (status) => {
    if (status === 'ACCEPTED') return 'bg-success'
    if (status === 'DECLINED') return 'bg-danger'
    return 'bg-warning text-dark'
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-7">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">Swap Requests</h2>
            <p className="text-muted mb-4">Manage your incoming and outgoing swap requests</p>

            {/* tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === 'received' ? 'active' : ''}`}
                  onClick={() => setTab('received')}
                >
                  Received ({received.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === 'sent' ? 'active' : ''}`}
                  onClick={() => setTab('sent')}
                >
                  Sent ({sent.length})
                </button>
              </li>
            </ul>

            {/* received requests list */}
            {tab === 'received' && (
              <div>
                {received.length === 0 && (
                  <p className="text-muted">No received requests yet.</p>
                )}
                {received.map(request => (
                  <div key={request.id} className="card mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">From: <strong>{request.fromUser}</strong></h6>
                        <span className={`badge ${statusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mb-1 text-muted small">
                        They offer: <strong>{request.offeredItem}</strong>
                      </p>
                      <p className="mb-3 text-muted small">
                        They want: <strong>{request.wantedItem}</strong>
                      </p>
                      {/* only show buttons if request is still pending */}
                      {request.status === 'PENDING' && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm"
                            style={{ backgroundColor: '#1a6eb5', color: 'white' }}
                            onClick={() => handleAccept(request.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDecline(request.id)}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* sent requests list */}
            {tab === 'sent' && (
              <div>
                {sent.length === 0 && (
                  <p className="text-muted">No sent requests yet.</p>
                )}
                {sent.map(request => (
                  <div key={request.id} className="card mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">To: <strong>{request.toUser}</strong></h6>
                        <span className={`badge ${statusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mb-1 text-muted small">
                        You offer: <strong>{request.offeredItem}</strong>
                      </p>
                      <p className="mb-0 text-muted small">
                        You want: <strong>{request.wantedItem}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default SwapRequests