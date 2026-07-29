import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

const { mockNavigate, mockCacheMyLocation } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockCacheMyLocation: vi.fn()
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

vi.mock('../api/users', () => ({
    cacheMyLocation: mockCacheMyLocation
}))

beforeEach(() => {
    mockNavigate.mockReset()
    mockCacheMyLocation.mockReset()
    mockCacheMyLocation.mockResolvedValue(undefined)

    localStorage.clear()
    sessionStorage.clear()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('LoginPage', () => {
    test('displays the login form', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        expect(
            screen.getByRole('heading', { name: /welcome back/i })
        ).toBeInTheDocument()

        expect(
            screen.getByPlaceholderText(/your@email.com/i)
        ).toBeInTheDocument()

        expect(
            screen.getByPlaceholderText(/your password/i)
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: /^log in$/i })
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', { name: /forgot password/i })
        ).toHaveAttribute('href', '/forgot-password')

        expect(
            screen.getByRole('link', { name: /register/i })
        ).toHaveAttribute('href', '/register')
    })

    test('allows the user to enter login details', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        const emailInput =
            screen.getByPlaceholderText(/your@email.com/i)

        const passwordInput =
            screen.getByPlaceholderText(/your password/i)

        await user.type(emailInput, 'joe@example.com')
        await user.type(passwordInput, 'Password123!')

        expect(emailInput).toHaveValue('joe@example.com')
        expect(passwordInput).toHaveValue('Password123!')
    })

    test('allows the user to show and hide the password', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        const passwordInput =
            screen.getByPlaceholderText(/your password/i)

        expect(passwordInput).toHaveAttribute('type', 'password')

        await user.click(
            screen.getByRole('button', { name: /show/i })
        )

        expect(passwordInput).toHaveAttribute('type', 'text')

        await user.click(
            screen.getByRole('button', { name: /hide/i })
        )

        expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('displays an error when the login details are invalid', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false
        })

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.type(
            screen.getByPlaceholderText(/your password/i),
            'WrongPassword'
        )

        await user.click(
            screen.getByRole('button', { name: /^log in$/i })
        )

        expect(
            await screen.findByText('Invalid email or password.')
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
        expect(mockCacheMyLocation).not.toHaveBeenCalled()
    })

    test('logs in the user, stores their details and navigates to profile', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                token: 'test-token',
                userId: 12,
                username: 'joeuser',
                email: 'joe@example.com'
            })
        })

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.type(
            screen.getByPlaceholderText(/your password/i),
            'Password123!'
        )

        await user.click(
            screen.getByRole('button', { name: /^log in$/i })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/profile')
        })

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/login'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'joe@example.com',
                    password: 'Password123!'
                })
            })
        )

        expect(localStorage.getItem('token')).toBe('test-token')
        expect(localStorage.getItem('userId')).toBe('12')
        expect(localStorage.getItem('username')).toBe('joeuser')
        expect(localStorage.getItem('email')).toBe('joe@example.com')

        expect(mockCacheMyLocation).toHaveBeenCalledTimes(1)
    })

    test('redirects to the 2FA page when two-factor authentication is required', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                requires2FA: true,
                tempToken: 'temporary-token'
            })
        })

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.type(
            screen.getByPlaceholderText(/your password/i),
            'Password123!'
        )

        await user.click(
            screen.getByRole('button', { name: /^log in$/i })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login/2fa')
        })

        expect(localStorage.getItem('tempToken'))
            .toBe('temporary-token')

        expect(localStorage.getItem('token')).toBeNull()
        expect(mockCacheMyLocation).not.toHaveBeenCalled()
    })

    test('returns the user to the item when login follows a swap request', async () => {
        const user = userEvent.setup()

        sessionStorage.setItem('swapIntent', JSON.stringify({
            itemId: 25,
            itemTitle: 'Mountain Bike'
        }))

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                token: 'test-token',
                userId: 12,
                username: 'joeuser',
                email: 'joe@example.com'
            })
        })

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        expect(
            screen.getByText(/log in to send your swap request/i)
        ).toBeInTheDocument()

        expect(
            screen.getByText('Mountain Bike')
        ).toBeInTheDocument()

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.type(
            screen.getByPlaceholderText(/your password/i),
            'Password123!'
        )

        await user.click(
            screen.getByRole('button', { name: /^log in$/i })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/items/25')
        })
    })

    test('displays an error when the login request fails', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch')
            .mockRejectedValue(new Error('Network error'))

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.type(
            screen.getByPlaceholderText(/your password/i),
            'Password123!'
        )

        await user.click(
            screen.getByRole('button', { name: /^log in$/i })
        )

        expect(
            await screen.findByText(
                'Could not login. Please try again..'
            )
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('does not submit when the password is empty', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch')

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.click(
            screen.getByRole('button', { name: /^log in$/i })
        )

        expect(fetch).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(
            screen.getByPlaceholderText(/your password/i)
        ).toBeInvalid()
    })

    test('does not submit when the email is empty', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch')

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/your password/i),
            'Password123!'
        )

        await user.click(
            screen.getByRole('button', { name: /^log in$/i })
        )

        expect(fetch).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(
            screen.getByPlaceholderText(/your@email.com/i)
        ).toBeInvalid()
    })

})