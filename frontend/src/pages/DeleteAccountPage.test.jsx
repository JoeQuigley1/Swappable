import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import DeleteAccountPage from './DeleteAccountPage'
import { deleteMyAccount } from '../api/users'
import { clearSession } from '../lib/auth'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

vi.mock('../api/users', () => ({
    deleteMyAccount: vi.fn()
}))

vi.mock('../lib/auth', () => ({
    clearSession: vi.fn()
}))

const renderPage = () => {
    return render(
        <MemoryRouter>
            <DeleteAccountPage />
        </MemoryRouter>
    )
}

describe('DeleteAccountPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        localStorage.setItem('token', 'valid-token')
    })

    it('renders the account deletion warning', () => {
        renderPage()

        expect(
            screen.getByRole('heading', { name: /delete account/i })
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /your profile, items and swap requests will be removed for good/i
            )
        ).toBeInTheDocument()
    })

    it('redirects unauthenticated users to login', async () => {
        localStorage.removeItem('token')

        renderPage()

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login')
        })
    })

    it('keeps the delete button disabled until DELETE is entered', async () => {
        const user = userEvent.setup()

        renderPage()

        const input = screen.getByRole('textbox')
        const deleteButton = screen.getByRole('button', {
            name: /delete my account/i
        })

        expect(deleteButton).toBeDisabled()

        await user.type(input, 'delete')

        expect(deleteButton).toBeDisabled()

        await user.clear(input)
        await user.type(input, 'DELETE')

        expect(deleteButton).toBeEnabled()
    })

    it('allows spaces around the confirmation phrase', async () => {
        const user = userEvent.setup()

        renderPage()

        const input = screen.getByRole('textbox')
        const deleteButton = screen.getByRole('button', {
            name: /delete my account/i
        })

        await user.type(input, '  DELETE  ')

        expect(deleteButton).toBeEnabled()
    })

    it('deletes the account, clears the session and redirects home', async () => {
        const user = userEvent.setup()

        deleteMyAccount.mockResolvedValue(undefined)

        renderPage()

        await user.type(screen.getByRole('textbox'), 'DELETE')

        await user.click(
            screen.getByRole('button', {
                name: /delete my account/i
            })
        )

        await waitFor(() => {
            expect(deleteMyAccount).toHaveBeenCalledTimes(1)
        })

        expect(clearSession).toHaveBeenCalledTimes(1)

        expect(mockNavigate).toHaveBeenCalledWith('/', {
            state: { accountDeleted: true }
        })
    })

    it('shows an error when account deletion fails', async () => {
        const user = userEvent.setup()

        deleteMyAccount.mockRejectedValue(new Error('server error'))

        renderPage()

        await user.type(screen.getByRole('textbox'), 'DELETE')

        await user.click(
            screen.getByRole('button', {
                name: /delete my account/i
            })
        )

        expect(
            await screen.findByText(
                /could not delete your account. please try again/i
            )
        ).toBeInTheDocument()

        expect(clearSession).not.toHaveBeenCalled()

        expect(
            screen.getByRole('button', {
                name: /delete my account/i
            })
        ).toBeEnabled()
    })

    it('clears the session and redirects to login when unauthenticated', async () => {
        const user = userEvent.setup()

        deleteMyAccount.mockRejectedValue(new Error('unauthenticated'))

        renderPage()

        await user.type(screen.getByRole('textbox'), 'DELETE')

        await user.click(
            screen.getByRole('button', {
                name: /delete my account/i
            })
        )

        await waitFor(() => {
            expect(clearSession).toHaveBeenCalledTimes(1)
            expect(mockNavigate).toHaveBeenCalledWith('/login')
        })
    })

    it('returns to the profile page when Cancel is clicked', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.click(
            screen.getByRole('button', {
                name: /cancel/i
            })
        )

        expect(mockNavigate).toHaveBeenCalledWith('/profile')
        expect(deleteMyAccount).not.toHaveBeenCalled()
    })

    it('shows a deleting state while the request is in progress', async () => {
        const user = userEvent.setup()

        let resolveDelete

        deleteMyAccount.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveDelete = resolve
                })
        )

        renderPage()

        await user.type(screen.getByRole('textbox'), 'DELETE')

        await user.click(
            screen.getByRole('button', {
                name: /delete my account/i
            })
        )

        expect(
            screen.getByRole('button', {
                name: /deleting/i
            })
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: /cancel/i
            })
        ).toBeDisabled()

        resolveDelete()

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/', {
                state: { accountDeleted: true }
            })
        })
    })
})