import { useState, useEffect } from 'react'
import { BRAND_COLOR } from '../lib/constants'
import {
  getReceivedSwapRequests,
  getSentSwapRequests,
  acceptSwapRequest,
  declineSwapRequest,
  confirmSwapRequest,
  cancelSwapRequest,
  abandonSwapRequest
} from '../api/swapRequests'

// backend sends lowercase status (pending/accepted/declined/cancelled/completed)
const norm = (s) => (s || '').toLowerCase()

// wording for the two destructive actions that go through the confirmation modal
const MODAL_COPY = {
  cancel: {
    title: 'Cancel Swap Request',
    question: 'Are you sure you want to cancel this swap request?',
    note: 'This action cannot be undone.',
    keepLabel: 'Keep Request',
    confirmLabel: 'Cancel Request'
  },
  abandon: {
    title: 'Abandon Swap',
    question: 'Are you sure you want to abandon this swap?',
    note: 'Both items become available again and the other person can no longer confirm the swap.',
    keepLabel: 'Keep Swap',
    confirmLabel: 'Abandon Swap'
  }
}

// shown while a swap is accepted; both sides confirm to complete it, or either
// side can abandon it if the swap never actually happened
function AcceptedActions({ mine, onConfirm, onAbandon }) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
      {mine ? (
        <p className="text-muted small mb-0">
          You confirmed this swap. Waiting for the other person to confirm.
        </p>
      ) : (
        <button
          className="btn btn-sm"
          style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
          onClick={onConfirm}
        >
          Confirm Swap
        </button>
      )}
      <button className="btn btn-sm btn-outline-danger" onClick={onAbandon}>
        Abandon Swap
      </button>
    </div>
  )
}

// shown once a swap is completed; contact details are no longer exposed
function CompletedNote({ date }) {
  const when = date ? ` on ${new Date(date).toLocaleDateString('en-IE')}` : ''
  return (
    <div className="alert alert-light border mt-3 mb-0 p-2 small">
      Swap completed{when}.
    </div>
  )
}

// shown when an accepted swap was abandoned by either side
function CancelledNote() {
  return (
    <div className="alert alert-light border mt-3 mb-0 p-2 small">
      Swap abandoned. Both items are available again.
    </div>
  )
}

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

  // pending destructive action awaiting confirmation: { id, mode: 'cancel' | 'abandon' }
  const [pendingAction, setPendingAction] = useState(null)

  // independent pagination state per tab
  const [receivedPage, setReceivedPage] = useState(0)
  const [receivedTotalPages, setReceivedTotalPages] = useState(0)
  const [sentPage, setSentPage] = useState(0)
  const [sentTotalPages, setSentTotalPages] = useState(0)
  const [receivedTotal, setReceivedTotal] = useState(0)
  const [sentTotal, setSentTotal] = useState(0)
  const PAGE_SIZE = 20

  // load both lists from the backend
  const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [r, s] = await Promise.all([
            getReceivedSwapRequests(receivedPage, PAGE_SIZE),
            getSentSwapRequests(sentPage, PAGE_SIZE),
           ])
        setReceived(r.content ?? [])
        setReceivedTotalPages(r.totalPages ?? 0)
        setReceivedTotal(r.totalElements ?? 0)
        setSent(s.content ?? [])
        setSentTotalPages(s.totalPages ?? 0)
        setSentTotal(s.totalElements ?? 0)
      } catch (err) {
        setError('Could not load swap requests.')
      } finally {
        setLoading(false)
      }
    }


     useEffect(() => { load() }, [receivedPage, sentPage])

    // act, then refetch so the lists reflect the new status
    const handleAccept = async (id) => {
      try { await acceptSwapRequest(id); await load() }
      catch (err) { setError('Could not accept the request. Please try again.') }
    }

    const handleDecline = async (id) => {
      try { await declineSwapRequest(id); await load() }
      catch (err) { setError('Could not decline the request. Please try again.') }
    }

    const handleConfirm = async (id) => {
      try { await confirmSwapRequest(id); await load() }
      catch (err) { setError('Could not confirm the swap. Please try again.') }
    }

  // runs whichever destructive action the modal was opened for
  const handlePendingAction = async () => {
    if (!pendingAction) return

    const { id, mode } = pendingAction

    try {
      setError('')

      if (mode === 'abandon') {
        await abandonSwapRequest(id)
      } else {
        await cancelSwapRequest(id)
      }

      setPendingAction(null)

      await load()

    } catch (err) {
      const noun = mode === 'abandon' ? 'abandon the swap' : 'cancel the request'

      if (err.message === 'unauthenticated') {
        setError(`You must be logged in to ${noun}.`)
        return
      }

      setError(err.message || `Could not ${noun}. Please try again.`)
    }
  }

  // pick badge colour based on status
  const statusBadge = (status) => {
    if (norm(status) === 'completed') return 'bg-primary'
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
                  Received ({receivedTotal})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === 'sent' ? 'active' : ''}`}
                  onClick={() => setTab('sent')}
                >
                  Sent ({sentTotal})
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
                        {request.message && (
                            <p className="mb-3 fst-italic">
                                "{request.message}"
                            </p>
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

                      {norm(request.status) === 'accepted' && (
                        <AcceptedActions
                          mine={request.ownerConfirmed}
                          onConfirm={() => handleConfirm(request.id)}
                          onAbandon={() => setPendingAction({ id: request.id, mode: 'abandon' })}
                        />
                      )}

                      {norm(request.status) === 'completed' && (
                        <CompletedNote date={request.completedAt} />
                      )}

                      {norm(request.status) === 'cancelled' && <CancelledNote />}

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
                 {receivedTotalPages > 1 && (
                     <div className="d-flex justify-content-center align-items-center gap-3 mt-3  mb-4">
                         <button
                            className="btn btn-outline-secondary btn-sm"
                             onClick={() => setReceivedPage((p) => Math.max(p - 1, 0))}
                             disabled={receivedPage === 0}
                            >
                              Previous
                              </button>
                              <span className="text-muted small">Page {receivedPage + 1} of {receivedTotalPages}</span>
                              <button
                                 className="btn btn-outline-secondary btn-sm"
                                 onClick={() => setReceivedPage((p) => Math.min(p + 1, receivedTotalPages - 1))}
                                 disabled={receivedPage + 1 >= receivedTotalPages}
                            >
                                      Next
                                    </button>
                                  </div>
                                )}
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
                      <p className="mb-3 text-muted small">
                        You want: <strong>{request.requestedItemTitle}</strong>
                      </p>

                      {norm(request.status) === 'pending' && (
                          <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setPendingAction({ id: request.id, mode: 'cancel' })}
                          >
                            Cancel Request
                          </button>
                      )}

                      {norm(request.status) === 'accepted' && (
                          <AcceptedActions
                            mine={request.requesterConfirmed}
                            onConfirm={() => handleConfirm(request.id)}
                            onAbandon={() => setPendingAction({ id: request.id, mode: 'abandon' })}
                          />
                      )}

                      {norm(request.status) === 'completed' && (
                        <CompletedNote date={request.completedAt} />
                      )}

                      {norm(request.status) === 'cancelled' && <CancelledNote />}

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
                 {sentTotalPages > 1 && (
                     <div className="d-flex justify-content-center align-items-center gap-3 mt-3 mb-4">
                         <button
                             className="btn btn-outline-secondary btn-sm"
                             onClick={() => setSentPage((p) => Math.max(p - 1, 0))}
                             disabled={sentPage === 0}
                            >
                             Previous
                         </button>
                         <span className="text-muted small">Page {sentPage + 1} of {sentTotalPages}</span>
                         <button
                             className="btn btn-outline-secondary btn-sm"
                             onClick={() => setSentPage((p) => Math.min(p + 1, sentTotalPages - 1))}
                             disabled={sentPage + 1 >= sentTotalPages}
                         >
                            Next
                         </button>
                     </div>
                 )}
              </div>
            )}

          </div>
        </div>
      </div>

      {pendingAction && (
          <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby="swapActionModalTitle"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5
                        className="modal-title"
                        id="swapActionModalTitle"
                    >
                      {MODAL_COPY[pendingAction.mode].title}
                    </h5>

                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => setPendingAction(null)}
                    />
                  </div>

                  <div className="modal-body">
                    <p className="mb-2">
                      {MODAL_COPY[pendingAction.mode].question}
                    </p>

                    <p className="text-muted mb-0">
                      {MODAL_COPY[pendingAction.mode].note}
                    </p>
                  </div>

                  <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setPendingAction(null)}
                    >
                      {MODAL_COPY[pendingAction.mode].keepLabel}
                    </button>

                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handlePendingAction}
                    >
                      {MODAL_COPY[pendingAction.mode].confirmLabel}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-backdrop fade show" />
          </>
      )}

    </div>
  )
}

export default SwapRequestsPage