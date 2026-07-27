import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from './RegisterPage'

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
})