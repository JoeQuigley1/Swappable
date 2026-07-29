import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

beforeEach(() => {
    mockNavigate.mockReset()
    localStorage.clear()
})

afterEach(() => {
    vi.restoreAllMocks()
})


describe('RegisterPage', () => {
    test('displays the registration form', () => {
        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        )

        expect(
            screen.getByRole('heading', { name: /create an account/i })
        ).toBeInTheDocument()

        expect(
            screen.getByPlaceholderText(/choose a username/i)
        ).toBeInTheDocument()

        expect(
            screen.getByPlaceholderText(/your@email.com/i)
        ).toBeInTheDocument()

        expect(
            screen.getByPlaceholderText(/choose a password/i)
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: /^register$/i })
        ).toBeInTheDocument()
    })

    test('allows the user to enter registration details', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        )

        const usernameInput =
            screen.getByPlaceholderText(/choose a username/i)

        const emailInput =
            screen.getByPlaceholderText(/your@email.com/i)

        const passwordInput =
            screen.getByPlaceholderText(/choose a password/i)

        await user.type(usernameInput, 'joeuser')
        await user.type(emailInput, 'joe@example.com')
        await user.type(passwordInput, 'Password123!')

        expect(usernameInput).toHaveValue('joeuser')
        expect(emailInput).toHaveValue('joe@example.com')
        expect(passwordInput).toHaveValue('Password123!')
    })

    test('allows the user to show and hide the password', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        )

        const passwordInput =
            screen.getByPlaceholderText(/choose a password/i)

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

    test('displays an error returned by the registration API', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            json: async () => ({
                message: 'Email already exists'
            })
        })

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/choose a username/i),
            'joeuser'
        )

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.type(
            screen.getByPlaceholderText(/choose a password/i),
            'Password123!'
        )

        await user.click(
            screen.getByRole('button', { name: /^register$/i })
        )

        expect(
            await screen.findByText('Email already exists')
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('registers the user and navigates to login', async () => {
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
                <RegisterPage />
            </MemoryRouter>
        )

        await user.type(
            screen.getByPlaceholderText(/choose a username/i),
            'joeuser'
        )

        await user.type(
            screen.getByPlaceholderText(/your@email.com/i),
            'joe@example.com'
        )

        await user.type(
            screen.getByPlaceholderText(/choose a password/i),
            'Password123!'
        )

        await user.click(
            screen.getByRole('button', { name: /^register$/i })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login')
        })

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/register'),
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'joeuser',
                    email: 'joe@example.com',
                    password: 'Password123!',
                    location: '',
                    lat: '',
                    lng: ''
                })
            })
        )

        expect(localStorage.getItem('token')).toBe('test-token')
        expect(localStorage.getItem('userId')).toBe('12')
        expect(localStorage.getItem('username')).toBe('joeuser')
        expect(localStorage.getItem('email')).toBe('joe@example.com')
    })
})