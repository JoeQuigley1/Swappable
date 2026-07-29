import { spreadMarkerPositions } from './BrowseItemsPage'

describe('spreadMarkerPositions', () => {
    test('leaves a single item at its own coordinates unchanged', () => {
        const result = spreadMarkerPositions([
            { id: 1, lat: 53.27, lng: -9.05 }
        ])

        expect(result).toEqual([
            { item: { id: 1, lat: 53.27, lng: -9.05 }, position: [53.27, -9.05] }
        ])
    })

    test('leaves items at different coordinates unchanged', () => {
        const items = [
            { id: 1, lat: 53.27, lng: -9.05 },
            { id: 2, lat: 53.35, lng: -6.26 }
        ]

        const result = spreadMarkerPositions(items)

        expect(result[0].position).toEqual([53.27, -9.05])
        expect(result[1].position).toEqual([53.35, -6.26])
    })

    test('spreads apart items that share the same owner coordinates', () => {
        // simulates one owner with three listed items - all three come
        // through with identical ownerLatitude/ownerLongitude
        const items = [
            { id: 1, lat: 53.27, lng: -9.05 },
            { id: 2, lat: 53.27, lng: -9.05 },
            { id: 3, lat: 53.27, lng: -9.05 }
        ]

        const result = spreadMarkerPositions(items)

        // the first one keeps the exact original coordinates
        expect(result[0].position).toEqual([53.27, -9.05])

        // every position is unique - no two items land on the same pixel
        const positions = result.map((r) => r.position.join(','))
        expect(new Set(positions).size).toBe(3)

        // the offset stays small (within roughly 100m) so pins remain
        // grouped near the real location rather than drifting away from it
        for (const { position } of result) {
            expect(Math.abs(position[0] - 53.27)).toBeLessThan(0.002)
            expect(Math.abs(position[1] - (-9.05))).toBeLessThan(0.002)
        }
    })

    test('preserves the original item reference alongside its position', () => {
        const item = { id: 5, lat: 53.27, lng: -9.05, title: 'Bike' }

        const [result] = spreadMarkerPositions([item])

        expect(result.item).toBe(item)
    })
})
