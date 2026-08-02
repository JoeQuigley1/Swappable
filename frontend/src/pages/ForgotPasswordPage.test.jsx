import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import ForgotPasswordPage from './ForgotPasswordPage'

const renderPage = () => {
    return render(
        <MemoryRouter>
            <ForgotPasswordPage />
        </MemoryRouter>
    )
}

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('displays the forgot password form', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: /forgot your password/i
            })
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(/email/i)
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: /send reset link/i
            })
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: /log in/i
            })
        ).toHaveAttribute('href', '/login')
    })

    test('shows a required error when email is empty', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.click(
            screen.getByRole('button', {
                name: /send reset link/i
            })
        )

        expect(
            screen.getByText(/email is required/i)
        ).toBeInTheDocument()

        expect(fetch).not.toHaveBeenCalled()
    })

    test('shows an error when the email format is invalid', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.type(
            screen.getByLabelText(/email/i),
            'not-an-email'
        )

        await user.click(
            screen.getByRole('button', {
                name: /send reset link/i
            })
        )

        expect(
            screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument()

        expect(fetch).not.toHaveBeenCalled()
    })

    test('treats whitespace-only email as empty', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.type(
            screen.getByLabelText(/email/i),
            '   '
        )

        await user.click(
            screen.getByRole('button', {
                name: /send reset link/i
            })
        )

        expect(
            screen.getByText(/email is required/i)
        ).toBeInTheDocument()

        expect(fetch).not.toHaveBeenCalled()
    })

    test('sends the trimmed email in the request body', async () => {
        const user = userEvent.setup()

        fetch.mockResolvedValue({
            ok: true
        })

        renderPage()

        await user.type(
            screen.getByLabelText(/email/i),
            '  joe@example.com  '
        )

        await user.click(
            screen.getByRole('button', {
                name: /send reset link/i
            })
        )

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1)
        })

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/forgot-password'),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'joe@example.com'
                })
            }
        )
    })

    test('shows the confirmation message after submission', async () => {
        const user = userEvent.setup()

        fetch.mockResolvedValue({
            ok: true
        })

        renderPage()

        await user.type(
            screen.getByLabelText(/email/i),
            'joe@example.com'
        )

        await user.click(
            screen.getByRole('button', {
                name: /send reset link/i
            })
        )

        expect(
            await screen.findByText(
                /if that email is registered, you will receive a reset link shortly/i
            )
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: /send reset link/i
            })
        ).not.toBeInTheDocument()
    })

    test('shows a general error when the request fails', async () => {
        const user = userEvent.setup()

        fetch.mockRejectedValue(new Error('network error'))

        renderPage()

        await user.type(
            screen.getByLabelText(/email/i),
            'joe@example.com'
        )

        await user.click(
            screen.getByRole('button', {
                name: /send reset link/i
            })
        )

        expect(
            await screen.findByText(
                /something went wrong\. please try again/i
            )
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                /if that email is registered/i
            )
        ).not.toBeInTheDocument()
    })
})