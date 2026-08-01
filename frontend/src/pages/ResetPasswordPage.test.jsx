import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { act, render, screen, waitFor } from '@testing-library/react'

import ResetPasswordPage from './ResetPasswordPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

const renderPage = (initialEntry = '/reset-password?token=valid-token') => {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />
            </Routes>
        </MemoryRouter>
    )
}

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()

        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders the reset password form when a token is present', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: /reset your password/i
            })
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(/^new password$/i)
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(/confirm new password/i)
        ).toBeInTheDocument()
    })

    it('shows an invalid-link message when no token is present', () => {
        renderPage('/reset-password')

        expect(
            screen.getByText(
                /invalid reset link\. please request a new one/i
            )
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: /request new reset link/i
            })
        ).toHaveAttribute('href', '/forgot-password')

        expect(
            screen.queryByRole('button', {
                name: /reset password/i
            })
        ).not.toBeInTheDocument()
    })

    it('shows required errors when both fields are empty', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        expect(
            screen.getByText(/new password is required/i)
        ).toBeInTheDocument()

        expect(
            screen.getByText(/please confirm your new password/i)
        ).toBeInTheDocument()

        expect(fetch).not.toHaveBeenCalled()
    })

    it('shows an error when the new password is shorter than 8 characters', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.type(
            screen.getByLabelText(/^new password$/i),
            'short'
        )

        await user.type(
            screen.getByLabelText(/confirm new password/i),
            'short'
        )

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        expect(
            screen.getByText(
                /password must be at least 8 characters/i
            )
        ).toBeInTheDocument()

        expect(fetch).not.toHaveBeenCalled()
    })

    it('shows an error when the passwords do not match', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.type(
            screen.getByLabelText(/^new password$/i),
            'password123'
        )

        await user.type(
            screen.getByLabelText(/confirm new password/i),
            'different123'
        )

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        expect(
            screen.getByText(/passwords do not match/i)
        ).toBeInTheDocument()

        expect(fetch).not.toHaveBeenCalled()
    })

    it('clears a field validation error when the user types in that field', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        expect(
            screen.getByText(/new password is required/i)
        ).toBeInTheDocument()

        await user.type(
            screen.getByLabelText(/^new password$/i),
            'p'
        )

        expect(
            screen.queryByText(/new password is required/i)
        ).not.toBeInTheDocument()
    })

    it('sends the token and new password in the request body', async () => {
        const user = userEvent.setup()

        fetch.mockResolvedValue({
            ok: true
        })

        renderPage()

        await user.type(
            screen.getByLabelText(/^new password$/i),
            'password123'
        )

        await user.type(
            screen.getByLabelText(/confirm new password/i),
            'password123'
        )

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1)
        })

        const [url, options] = fetch.mock.calls[0]

        expect(url).toContain('/auth/reset-password')

        expect(options).toEqual({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: 'valid-token',
                newPassword: 'password123'
            })
        })
    })

    it('shows the success message after a successful reset', async () => {
        const user = userEvent.setup()

        fetch.mockResolvedValue({
            ok: true
        })

        renderPage()

        await user.type(
            screen.getByLabelText(/^new password$/i),
            'password123'
        )

        await user.type(
            screen.getByLabelText(/confirm new password/i),
            'password123'
        )

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        expect(
            await screen.findByText(
                /password reset successfully/i
            )
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: /reset password/i
            })
        ).not.toBeInTheDocument()
    })

    it('shows an invalid or expired link error when the response is unsuccessful', async () => {
        const user = userEvent.setup()

        fetch.mockResolvedValue({
            ok: false
        })

        renderPage()

        await user.type(
            screen.getByLabelText(/^new password$/i),
            'password123'
        )

        await user.type(
            screen.getByLabelText(/confirm new password/i),
            'password123'
        )

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        expect(
            await screen.findByText(
                /this reset link is invalid or has expired/i
            )
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('shows a general error when the request fails', async () => {
        const user = userEvent.setup()

        fetch.mockRejectedValue(new Error('network error'))

        renderPage()

        await user.type(
            screen.getByLabelText(/^new password$/i),
            'password123'
        )

        await user.type(
            screen.getByLabelText(/confirm new password/i),
            'password123'
        )

        await user.click(
            screen.getByRole('button', {
                name: /reset password/i
            })
        )

        expect(
            await screen.findByText(
                /something went wrong\. please try again/i
            )
        ).toBeInTheDocument()
    })
})