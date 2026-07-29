import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SwapRequestsPage from './SwapRequestsPage'
import {
    getReceivedSwapRequests,
    getSentSwapRequests,
    acceptSwapRequest,
    declineSwapRequest,
    confirmSwapRequest,
    cancelSwapRequest
} from '../api/swapRequests'

vi.mock('../api/swapRequests', () => ({
    getReceivedSwapRequests: vi.fn(),
    getSentSwapRequests: vi.fn(),
    acceptSwapRequest: vi.fn(),
    declineSwapRequest: vi.fn(),
    confirmSwapRequest: vi.fn(),
    cancelSwapRequest: vi.fn()
}))

const RECEIVED_REQUEST = {
    id: 1,
    status: 'pending',
    requesterUsername: 'anna',
    offeredItemTitle: 'Bike',
    requestedItemTitle: 'Guitar'
}

const SENT_REQUEST = {
    id: 2,
    status: 'pending',
    ownerUsername: 'ben',
    offeredItemTitle: 'Lamp',
    requestedItemTitle: 'Desk'
}

function emptyPage() {
    return { content: [], totalPages: 0, totalElements: 0 }
}

beforeEach(() => {
    getReceivedSwapRequests.mockReset()
    getSentSwapRequests.mockReset()
    acceptSwapRequest.mockReset()
    declineSwapRequest.mockReset()
    confirmSwapRequest.mockReset()
    cancelSwapRequest.mockReset()

    getReceivedSwapRequests.mockResolvedValue({
        content: [RECEIVED_REQUEST],
        totalPages: 1,
        totalElements: 1
    })
    getSentSwapRequests.mockResolvedValue({
        content: [SENT_REQUEST],
        totalPages: 1,
        totalElements: 1
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('SwapRequestsPage', () => {
    test('loads and displays received requests by default', async () => {
        render(<SwapRequestsPage />)

        expect(
            await screen.findByText(/from:/i)
        ).toBeInTheDocument()

        expect(screen.getByText('anna')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /received \(1\)/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sent \(1\)/i })).toBeInTheDocument()
    })

    test('switches to the sent tab', async () => {
        const user = userEvent.setup()
        render(<SwapRequestsPage />)

        await screen.findByText(/from:/i)

        await user.click(screen.getByRole('button', { name: /sent \(1\)/i }))

        expect(await screen.findByText(/to:/i)).toBeInTheDocument()
        expect(screen.getByText('ben')).toBeInTheDocument()
    })

    test('shows empty state messages when there are no requests', async () => {
        getReceivedSwapRequests.mockResolvedValue(emptyPage())
        getSentSwapRequests.mockResolvedValue(emptyPage())

        const user = userEvent.setup()
        render(<SwapRequestsPage />)

        expect(
            await screen.findByText(/no received requests yet/i)
        ).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /sent \(0\)/i }))

        expect(
            await screen.findByText(/no sent requests yet/i)
        ).toBeInTheDocument()
    })

    test('accepting a received request calls the API and reloads the list', async () => {
        const user = userEvent.setup()
        acceptSwapRequest.mockResolvedValue(null)

        render(<SwapRequestsPage />)

        await screen.findByText(/from:/i)

        await user.click(screen.getByRole('button', { name: /^accept$/i }))

        await waitFor(() => {
            expect(acceptSwapRequest).toHaveBeenCalledWith(1)
        })

        expect(getReceivedSwapRequests).toHaveBeenCalledTimes(2)
    })

    test('declining a received request calls the API and reloads the list', async () => {
        const user = userEvent.setup()
        declineSwapRequest.mockResolvedValue(null)

        render(<SwapRequestsPage />)

        await screen.findByText(/from:/i)

        await user.click(screen.getByRole('button', { name: /^decline$/i }))

        await waitFor(() => {
            expect(declineSwapRequest).toHaveBeenCalledWith(1)
        })
    })

    test('shows an error if accepting fails', async () => {
        const user = userEvent.setup()
        acceptSwapRequest.mockRejectedValue(new Error('failed'))

        render(<SwapRequestsPage />)

        await screen.findByText(/from:/i)

        await user.click(screen.getByRole('button', { name: /^accept$/i }))

        expect(
            await screen.findByText(/could not accept the request/i)
        ).toBeInTheDocument()
    })

    test('accepted request shows a confirm button for the other party', async () => {
        const user = userEvent.setup()
        getReceivedSwapRequests.mockResolvedValue({
            content: [{ ...RECEIVED_REQUEST, status: 'accepted', ownerConfirmed: false }],
            totalPages: 1,
            totalElements: 1
        })
        confirmSwapRequest.mockResolvedValue(null)

        render(<SwapRequestsPage />)

        const confirmButton = await screen.findByRole('button', { name: /confirm swap/i })
        await user.click(confirmButton)

        await waitFor(() => {
            expect(confirmSwapRequest).toHaveBeenCalledWith(1)
        })
    })

    test('accepted request shows a waiting message once the user has confirmed', async () => {
        getReceivedSwapRequests.mockResolvedValue({
            content: [{ ...RECEIVED_REQUEST, status: 'accepted', ownerConfirmed: true }],
            totalPages: 1,
            totalElements: 1
        })

        render(<SwapRequestsPage />)

        expect(
            await screen.findByText(/waiting for the other person to confirm/i)
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', { name: /confirm swap/i })
        ).not.toBeInTheDocument()
    })

    test('completed request shows the completed note and no action buttons', async () => {
        getReceivedSwapRequests.mockResolvedValue({
            content: [{ ...RECEIVED_REQUEST, status: 'completed', completedAt: '2026-01-01T00:00:00Z' }],
            totalPages: 1,
            totalElements: 1
        })

        render(<SwapRequestsPage />)

        expect(
            await screen.findByText(/swap completed/i)
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', { name: /^accept$/i })
        ).not.toBeInTheDocument()
    })

    test('cancelling a sent request opens a confirmation modal before calling the API', async () => {
        const user = userEvent.setup()
        cancelSwapRequest.mockResolvedValue(null)

        render(<SwapRequestsPage />)

        await screen.findByText(/from:/i)
        await user.click(screen.getByRole('button', { name: /sent \(1\)/i }))
        await screen.findByText(/to:/i)

        await user.click(screen.getByRole('button', { name: /cancel request/i }))

        expect(
            await screen.findByText(/are you sure you want to cancel this swap request/i)
        ).toBeInTheDocument()

        expect(cancelSwapRequest).not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: /keep request/i }))

        expect(cancelSwapRequest).not.toHaveBeenCalled()
        expect(
            screen.queryByText(/are you sure you want to cancel this swap request/i)
        ).not.toBeInTheDocument()
    })

    test('confirming the cancel modal calls the API and reloads the list', async () => {
        const user = userEvent.setup()
        cancelSwapRequest.mockResolvedValue(null)

        render(<SwapRequestsPage />)

        await screen.findByText(/from:/i)
        await user.click(screen.getByRole('button', { name: /sent \(1\)/i }))
        await screen.findByText(/to:/i)

        await user.click(screen.getByRole('button', { name: /cancel request/i }))
        await screen.findByText(/are you sure you want to cancel this swap request/i)

        // two "Cancel Request" buttons now exist: the row action and the
        // modal's confirm button, which is the last one in document order
        const cancelButtons = screen.getAllByRole('button', { name: /cancel request/i })
        await user.click(cancelButtons[cancelButtons.length - 1])

        await waitFor(() => {
            expect(cancelSwapRequest).toHaveBeenCalledWith(2)
        })

        expect(getSentSwapRequests).toHaveBeenCalledTimes(2)
    })

    test('contact details are shown when the backend includes them', async () => {
        getReceivedSwapRequests.mockResolvedValue({
            content: [{
                ...RECEIVED_REQUEST,
                status: 'accepted',
                ownerConfirmed: false,
                contactDetails: { username: 'anna', email: 'anna@test.com', phoneNumber: '0871234567' }
            }],
            totalPages: 1,
            totalElements: 1
        })

        render(<SwapRequestsPage />)

        expect(
            await screen.findByText(/contact anna to arrange it/i)
        ).toBeInTheDocument()

        expect(screen.getByText('anna@test.com')).toBeInTheDocument()
        expect(screen.getByText('0871234567')).toBeInTheDocument()
    })

    test('pagination controls step through received pages', async () => {
        const user = userEvent.setup()
        getReceivedSwapRequests.mockResolvedValue({
            content: [RECEIVED_REQUEST],
            totalPages: 2,
            totalElements: 21
        })

        render(<SwapRequestsPage />)

        await screen.findByText(/from:/i)

        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^previous$/i })).toBeDisabled()

        await user.click(screen.getByRole('button', { name: /^next$/i }))

        await waitFor(() => {
            expect(getReceivedSwapRequests).toHaveBeenCalledWith(1, 20)
        })
    })

    test('shows a page-level error when loading requests fails', async () => {
        getReceivedSwapRequests.mockRejectedValue(new Error('network error'))
        getSentSwapRequests.mockRejectedValue(new Error('network error'))

        render(<SwapRequestsPage />)

        expect(
            await screen.findByText(/could not load swap requests/i)
        ).toBeInTheDocument()
    })
})
