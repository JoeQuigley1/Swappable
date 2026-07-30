import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryCard from './CategoryCard'

const CATEGORY = { name: 'Books', icon: 'bi-book', count: 4 }

describe('CategoryCard', () => {
    test('shows the category name and item count', () => {
        render(<CategoryCard category={CATEGORY} />)

        expect(screen.getByText('Books')).toBeInTheDocument()
        expect(screen.getByText('4 items')).toBeInTheDocument()
    })

    test('calls onSelect when clicked', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()

        render(<CategoryCard category={CATEGORY} onSelect={onSelect} />)

        await user.click(screen.getByRole('button', { name: /browse books items/i }))

        expect(onSelect).toHaveBeenCalledTimes(1)
    })

    test('calls onSelect from the keyboard', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()

        render(<CategoryCard category={CATEGORY} onSelect={onSelect} />)

        await user.tab()
        expect(screen.getByRole('button', { name: /browse books items/i })).toHaveFocus()

        await user.keyboard('{Enter}')
        expect(onSelect).toHaveBeenCalledTimes(1)
    })

    test('does not break without an onSelect handler', async () => {
        const user = userEvent.setup()

        render(<CategoryCard category={CATEGORY} />)

        await user.click(screen.getByRole('button', { name: /browse books items/i }))
    })
})
