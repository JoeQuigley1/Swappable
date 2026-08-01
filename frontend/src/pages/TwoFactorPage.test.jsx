import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import TwoFactorPage from './TwoFactorPage'
import { cacheMyLocation } from '../api/users'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

vi.mock('../api/users', () => ({
    cacheMyLocation: vi.fn()
}))

const renderPage = () => {
    return render(
        <MemoryRouter>
            <TwoFactorPage />
        </MemoryRouter>
    )
}

describe('TwoFactorPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        sessionStorage.clear()
        global.fetch = vi.fn()
        cacheMyLocation.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('displays the two-factor authentication form', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: /two-factor authentication/i
            })
        ).toBeInTheDocument()

        expect(
            screen.getByPlaceholderText('123456')
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: /verify/i
            })
        ).toBeInTheDocument()
    })

    test('redirects to login when no temporary token exists', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.type(
            screen.getByPlaceholderText('123456'),
            '123456'
        )

        await user.click(
            screen.getByRole('button', {
                name: /verify/i
            })
        )

        expect(mockNavigate).toHaveBeenCalledWith('/login')
        expect(fetch).not.toHaveBeenCalled()
    })

    test('shows an error when the authentication code is invalid', async () => {
        const user = userEvent.setup()

        localStorage.setItem('tempToken', 'temporary-token')

        fetch.mockResolvedValue({
            ok: false
        })

        renderPage()

        await user.type(
            screen.getByPlaceholderText('123456'),
            '000000'
        )

        await user.click(
            screen.getByRole('button', {
                name: /verify/i
            })
        )

        expect(
            await screen.findByText(
                /invalid code\. please try again/i
            )
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('saves the session and navigates to profile after successful verification', async () => {
        const user = userEvent.setup()

        localStorage.setItem('tempToken', 'temporary-token')

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                token: 'real-token',
                userId: 12,
                username: 'anna',
                email: 'anna@test.com'
            })
        })

        renderPage()

        await user.type(
            screen.getByPlaceholderText('123456'),
            '123456'
        )

        await user.click(
            screen.getByRole('button', {
                name: /verify/i
            })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/profile')
        })

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/2fa/validate'),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tempToken: 'temporary-token',
                    code: '123456'
                })
            }
        )

        expect(localStorage.getItem('tempToken')).toBeNull()
        expect(localStorage.getItem('token')).toBe('real-token')
        expect(localStorage.getItem('userId')).toBe('12')
        expect(localStorage.getItem('username')).toBe('anna')
        expect(localStorage.getItem('email')).toBe('anna@test.com')

        expect(cacheMyLocation).toHaveBeenCalledTimes(1)
    })

    test('returns to the pending item after successful verification', async () => {
        const user = userEvent.setup()

        localStorage.setItem('tempToken', 'temporary-token')

        sessionStorage.setItem(
            'swapIntent',
            JSON.stringify({
                itemId: 25,
                itemTitle: 'Old guitar'
            })
        )

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                token: 'real-token',
                userId: 12,
                username: 'anna',
                email: 'anna@test.com'
            })
        })

        renderPage()

        expect(
            screen.getByText(/old guitar/i)
        ).toBeInTheDocument()

        await user.type(
            screen.getByPlaceholderText('123456'),
            '123456'
        )

        await user.click(
            screen.getByRole('button', {
                name: /verify/i
            })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/items/25')
        })
    })

    test('shows a general error when the request fails', async () => {
        const user = userEvent.setup()

        localStorage.setItem('tempToken', 'temporary-token')

        fetch.mockRejectedValue(
            new Error('network error')
        )

        renderPage()

        await user.type(
            screen.getByPlaceholderText('123456'),
            '123456'
        )

        await user.click(
            screen.getByRole('button', {
                name: /verify/i
            })
        )

        expect(
            await screen.findByText(
                /something went wrong\. please try again/i
            )
        ).toBeInTheDocument()
    })
})