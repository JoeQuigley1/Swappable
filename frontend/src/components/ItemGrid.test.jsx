import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ItemGrid from './ItemGrid'

const ITEMS = [
    { id: 1, title: 'Old guitar', description: 'Acoustic', category: 'Music', condition: 'Good', owner: 'anna', ownerId: 2, location: 'Galway', imageUrl: null },
    { id: 2, title: 'Desk lamp', description: 'Works fine', category: 'Furniture', condition: 'Fair', owner: 'ben', ownerId: 3, location: 'Cork', imageUrl: null }
]

function renderGrid(props) {
    const { container } = render(
        <MemoryRouter>
            <ItemGrid items={ITEMS} {...props} />
        </MemoryRouter>
    )
    return container.querySelector('.row')
}

describe('ItemGrid', () => {
    test('lays out three cards per row by default', () => {
        expect(renderGrid()).toHaveClass('row-cols-lg-3')
    })

    test('lays out the requested number of cards per row', () => {
        expect(renderGrid({ columnsLg: 4 })).toHaveClass('row-cols-lg-4')
    })

    test('shows the empty state instead of a grid', () => {
        render(
            <MemoryRouter>
                <ItemGrid items={[]} columnsLg={4} />
            </MemoryRouter>
        )

        expect(screen.getByText(/no items found/i)).toBeInTheDocument()
    })
})
