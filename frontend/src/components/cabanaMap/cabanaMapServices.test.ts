import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	bookCabana,
	buildCabanaLookup,
	fetchMapData,
	getCell,
	getRoadTileVariant,
	getTileAsset,
	getTileRotation,
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

afterEach(() => {
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

describe('cabanaMapServices', () => {
	it('fetchMapData returns parsed map data from the API', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => mapFixture,
		})
		vi.stubGlobal('fetch', fetchMock)

		const result = await fetchMapData('http://localhost:3000')

		expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/map')
		expect(result).toEqual(mapFixture)
	})

	it('fetchMapData throws a status-based error for failed responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 503,
			}),
		)

		await expect(fetchMapData('http://localhost:3000')).rejects.toThrow('Map request failed (503)')
	})

	it('bookCabana posts JSON and returns fallback values when the API omits them', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ success: true }),
		})
		vi.stubGlobal('fetch', fetchMock)

		const result = await bookCabana('http://localhost:3000', 'cabana-0-0', {
			room: '101',
			guestName: 'Alex Guest',
		})

		expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/cabanas/cabana-0-0/bookings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ room: '101', guestName: 'Alex Guest' }),
		})
		expect(result).toEqual({
			success: true,
			message: 'Cabana booked successfully',
			cabanaId: 'cabana-0-0',
		})
	})

	it('bookCabana throws the API message when the booking fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 409,
				json: async () => ({ success: false, message: 'Cabana is already booked' }),
			}),
		)

		await expect(
			bookCabana('http://localhost:3000', 'cabana-0-0', { room: '101', guestName: 'Alex Guest' }),
		).rejects.toThrow('Cabana is already booked')
	})

	it('bookCabana falls back to a status-based error when the API omits a failure message', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({ success: false }),
			}),
		)

		await expect(
			bookCabana('http://localhost:3000', 'cabana-0-0', { room: '101', guestName: 'Alex Guest' }),
		).rejects.toThrow('Booking request failed (500)')
	})

	it('buildCabanaLookup returns an empty map for null input', () => {
		expect(buildCabanaLookup(null).size).toBe(0)
	})

	it('buildCabanaLookup returns lookup map keyed by x,y', () => {
		const lookup = buildCabanaLookup(mapFixture)

		expect(lookup.get('0,0')?.id).toBe('cabana-0-0')
	})

	it('getCell returns the cell value for in-bounds coordinates', () => {
		expect(getCell(mapFixture.grid, 1, 0)).toBe('#')
		expect(getCell(mapFixture.grid, 0, 1)).toBe('c')
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

	it('shouldUsePoolTexture returns true when a pool has an orthogonal pool neighbor', () => {
		const grid = [
			['p', 'p'],
			['.', '.'],
		]

		expect(shouldUsePoolTexture(grid, 0, 0)).toBe(true)
		expect(shouldUsePoolTexture(grid, 1, 0)).toBe(true)
	})

	it('getRoadTileVariant returns end by default for isolated road', () => {
		const grid = [['#']]
		const variant = getRoadTileVariant(grid, 0, 0)

		expect(variant.variant).toBe('end')
		expect(variant.rotation).toBe(0)
	})

	it('getRoadTileVariant returns crossing for four-way roads', () => {
		const grid = [
			['.', '#', '.'],
			['#', '#', '#'],
			['.', '#', '.'],
		]

		expect(getRoadTileVariant(grid, 1, 1)).toEqual({ variant: 'crossing', rotation: 0 })
	})

	it('getRoadTileVariant returns split with the correct rotation', () => {
		const grid = [
			['#', '#', '#'],
			['.', '#', '.'],
			['.', '#', '.'],
		]

		expect(getRoadTileVariant(grid, 1, 0)).toEqual({ variant: 'split', rotation: 90 })
	})

	it('getRoadTileVariant returns corner and straight variants with the correct rotation', () => {
		const cornerGrid = [
			['#', '#'],
			['#', '.'],
		]
		const straightGrid = [['#', '#', '#']]

		expect(getRoadTileVariant(cornerGrid, 0, 0)).toEqual({ variant: 'corner', rotation: 90 })
		expect(getRoadTileVariant(straightGrid, 1, 0)).toEqual({ variant: 'straight', rotation: 90 })
	})

	it('getRoadTileVariant connects roads to chalets from the preferred side only', () => {
		const grid = [
			['.', 'c', '.'],
			['.', '#', '.'],
			['.', '#', '.'],
		]

		expect(getRoadTileVariant(grid, 1, 1)).toEqual({ variant: 'straight', rotation: 0 })
	})

	it('getTileRotation returns 0 for non-road tiles and road rotation for road tiles', () => {
		const roadMap: MapResponse = {
			...mapFixture,
			grid: [['#', '#', '#']],
		}

		expect(getTileRotation('W', mapFixture, 0, 0)).toBe(0)
		expect(getTileRotation('#', roadMap, 1, 0)).toBe(90)
	})

	it('getTileAsset selects assets by symbol and pool adjacency', () => {
		const textureMap: MapResponse = {
			...mapFixture,
			grid: [
				['p', 'p'],
				['W', 'c'],
			],
		}
		const plainPoolMap: MapResponse = {
			...mapFixture,
			grid: [['p']],
		}

		expect(getTileAsset('p', textureMap, 0, 0)).not.toBe(getTileAsset('p', plainPoolMap, 0, 0))
		expect(getTileAsset('W', mapFixture, 0, 0)).not.toBe(getTileAsset('c', mapFixture, 0, 0))
		expect(getTileAsset('.', mapFixture, 1, 0)).not.toBe(getTileAsset('W', mapFixture, 0, 0))
	})
})
