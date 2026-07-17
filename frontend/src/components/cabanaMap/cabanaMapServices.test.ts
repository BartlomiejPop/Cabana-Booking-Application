import { describe, expect, it } from 'vitest'
import {
	buildCabanaLookup,
	getCell,
	getRoadTileVariant,
	shouldUsePoolTexture,
	type MapResponse,
} from './cabanaMapServices.ts'

const mapFixture: MapResponse = {
	map: 'W#\ncp',
	rows: ['W#', 'cp'],
	grid: [
		['W', '#'],
		['c', 'p'],
	],
	cabanas: [{ id: 'cabana-0-0', x: 0, y: 0, isBooked: false }],
}

describe('cabanaMapServices', () => {
	it('buildCabanaLookup returns lookup map keyed by x,y', () => {
		const lookup = buildCabanaLookup(mapFixture)

		expect(lookup.get('0,0')?.id).toBe('cabana-0-0')
	})

	it('getCell returns null for out-of-bounds coordinates', () => {
		expect(getCell(mapFixture.grid, -1, 0)).toBeNull()
		expect(getCell(mapFixture.grid, 10, 0)).toBeNull()
		expect(getCell(mapFixture.grid, 0, -1)).toBeNull()
		expect(getCell(mapFixture.grid, 0, 10)).toBeNull()
	})

	it('shouldUsePoolTexture checks orthogonal pool neighbors only', () => {
		const grid = [
			['p', '.', '.'],
			['.', 'p', '.'],
			['.', '.', 'p'],
		]

		expect(shouldUsePoolTexture(grid, 1, 1)).toBe(false)
		expect(shouldUsePoolTexture(grid, 0, 0)).toBe(false)
	})

	it('getRoadTileVariant returns end by default for isolated road', () => {
		const grid = [['#']]
		const variant = getRoadTileVariant(grid, 0, 0)

		expect(variant.variant).toBe('end')
	})
})
