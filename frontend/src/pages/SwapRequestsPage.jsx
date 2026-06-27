import { useState, useEffect } from 'react'
import { BRAND_COLOR } from '../lib/constants'
import {
  getReceivedSwapRequests, getSentSwapRequests,
  acceptSwapRequest, declineSwapRequest,cancelSwapRequest,
} from '../api/swapRequests'

// backend sends lowercase status (pending/accepted/declined/cancelled)
const norm = (s) => (s || '').toLowerCase()

// page for managing swap requests
function SwapRequestsPage() {

  // list of received requests
  const [received, setReceived] = useState([])
  // list of sent requests
  const [sent, setSent] = useState([])
  // controls which tab is open right now
  const [tab, setTab] = useState('received')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // load both lists from the backend
  const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [r, s] = await Promise.all([getReceivedSwapRequests(), getSentSwapRequests()])
        setReceived(r)
        setSent(s)
      } catch (err) {
        setError('Could not load swap requests.')
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => { load() }, [])

    // act, then refetch so the lists reflect the new status
    const handleAccept = async (id) => {
      try { await acceptSwapRequest(id); await load() }
      catch (err) { setError('Could not accept the request. Please try again.') }
    }

    const handleDecline = async (id) => {
      try { await declineSwapRequest(id); await load() }
      catch (err) { setError('Could not decline the request. Please try again.') }
    }
    const handleCancel = async (id) => {
        try { await cancelSwapRequest(id); await load() }
         catch (err) { setError('Could not cancel the request. Please try again.') }
    }

  // pick badge colour based on status
  const statusBadge = (status) => {
    if (norm(status) === 'accepted') return 'bg-success'
    if (norm(status) === 'declined') return 'bg-danger'
    if (norm(status) === 'cancelled') return 'bg-secondary'
    return 'bg-warning text-dark'
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-7">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">Swap Requests</h2>
            <p className="text-muted mb-4">Manage your incoming and outgoing swap requests</p>

            {error && <div className="alert alert-danger">{error}</div>}
            {loading && <p className="text-muted">Loading…</p>}


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
                        <h6 className="mb-0">From: <strong>{request.requesterUsername}</strong></h6>
                        <span className={`badge ${statusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mb-1 text-muted small">
                        They offer: <strong>{request.offeredItemTitle}</strong>
                      </p>
                      <p className="mb-3 text-muted small">
                        They want: <strong>{request.requestedItemTitle}</strong>
                      </p>
                       {norm(request.status) === 'pending' && (
                           <div className="mt-2">
                               <button
                                 className="btn btn-sm btn-outline-danger"
                                 onClick={() => handleCancel(request.id)}
                               >
                                 Cancel request
                               </button>
                              </div>
                            )}
                      {/* only show buttons if request is still pending */}
                      {norm(request.status) === 'pending' && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm"
                            style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
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

                         {request.contactDetails && (
                             <div className="alert alert-success mt-3 mb-0 p-2 small">
                                 <strong>Swap accepted — contact {request.contactDetails.username} to arrange it:</strong>
                                 <div className="mt-1">
                                     Email: <a href={`mailto:${request.contactDetails.email}`}>{request.contactDetails.email}</a>
                                 </div>
                                 {request.contactDetails.phoneNumber && (
                                     <div>
                                         Phone: <a href={`tel:${request.contactDetails.phoneNumber}`}>{request.contactDetails.phoneNumber}</a>
                                     </div>
                                 )}
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
                        <h6 className="mb-0">To: <strong>{request.ownerUsername}</strong></h6>
                        <span className={`badge ${statusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mb-1 text-muted small">
                        You offer: <strong>{request.offeredItemTitle}</strong>
                      </p>
                      <p className="mb-0 text-muted small">
                        You want: <strong>{request.requestedItemTitle}</strong>
                      </p>

                      {request.contactDetails && (
                          <div className="alert alert-success mt-3 mb-0 p-2 small">
                              <strong>Swap accepted — contact {request.contactDetails.username} to arrange it:</strong>
                              <div className="mt-1">
                                  Email: <a href={`mailto:${request.contactDetails.email}`}>{request.contactDetails.email}</a>
                              </div>
                              {request.contactDetails.phoneNumber && (
                                  <div>
                                      Phone: <a href={`tel:${request.contactDetails.phoneNumber}`}>{request.contactDetails.phoneNumber}</a>
                                  </div>
                              )}
                          </div>
                        )}
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

export default SwapRequestsPage