import arrowCornerSquare from '../../assets/arrowCornerSquare.png'
import arrowCrossing from '../../assets/arrowCrossing.png'
import arrowEnd from '../../assets/arrowEnd.png'
import arrowSplit from '../../assets/arrowSplit.png'
import arrowStraight from '../../assets/arrowStraight.png'
import cabanaTile from '../../assets/cabana.png'
import chaletTile from '../../assets/houseChimney.png'
import emptyTile from '../../assets/parchmentBasic.png'
import poolTile from '../../assets/pool.png'
import textureWaterTile from '../../assets/textureWater.png'

export type Direction = 'up' | 'right' | 'down' | 'left'

export type Cabana = {
	id: string
	x: number
	y: number
	isBooked: boolean
}

export type MapResponse = {
	map: string
	rows: string[]
	grid: string[][]
	cabanas: Cabana[]
}

export type CabanaBookingRequest = {
	room: string
	guestName: string
}

export type CabanaBookingResponse = {
	success: boolean
	message: string
	cabanaId: string
}

export type RoadVariant = 'crossing' | 'split' | 'corner' | 'straight' | 'end'

export type RoadTileVariant = {
	variant: RoadVariant
	rotation: number
}

const ROTATION_90 = 90
const ROTATION_180 = 180
const ROTATION_270 = 270

function getRoadVariantAsset(variant: RoadVariant): string {
	if (variant === 'crossing') return arrowCrossing
	if (variant === 'split') return arrowSplit
	if (variant === 'corner') return arrowCornerSquare
	if (variant === 'straight') return arrowStraight
	return arrowEnd
}

export async function fetchMapData(apiBaseUrl: string): Promise<MapResponse> {
	const response = await fetch(`${apiBaseUrl}/api/map`)
	if (!response.ok) {
		throw new Error(`Map request failed (${response.status})`)
	}

	return (await response.json()) as MapResponse
}

export async function bookCabana(
	apiBaseUrl: string,
	cabanaId: string,
	payload: CabanaBookingRequest,
): Promise<CabanaBookingResponse> {
	const response = await fetch(`${apiBaseUrl}/api/cabanas/${cabanaId}/bookings`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	const data = (await response.json()) as Partial<CabanaBookingResponse>

	if (!response.ok || !data.success) {
		throw new Error(data.message ?? `Booking request failed (${response.status})`)
	}

	return {
		success: true,
		message: data.message ?? 'Cabana booked successfully',
		cabanaId: data.cabanaId ?? cabanaId,
	}
}

export function buildCabanaLookup(mapData: MapResponse | null): Map<string, Cabana> {
	const lookup = new Map<string, Cabana>()
	if (!mapData) {
		return lookup
	}

	mapData.cabanas.forEach((cabana) => {
		lookup.set(`${cabana.x},${cabana.y}`, cabana)
	})

	return lookup
}

export function getCell(grid: string[][], x: number, y: number): string | null {
	if (y < 0 || y >= grid.length) {
		return null
	}

	if (x < 0 || x >= grid[y].length) {
		return null
	}

	return grid[y][x]
}

function directionSetKey(directions: Direction[]): string {
	return directions.slice().sort().join('-')
}

function oppositeDirection(direction: Direction): Direction {
	if (direction === 'up') return 'down'
	if (direction === 'right') return 'left'
	if (direction === 'down') return 'up'
	return 'right'
}

function preferredChaletConnectionSide(grid: string[][], chaletX: number, chaletY: number): Direction | null {
	const roadNeighbors = new Set<Direction>()

	if (getCell(grid, chaletX, chaletY + 1) === '#') roadNeighbors.add('down')
	if (getCell(grid, chaletX - 1, chaletY) === '#') roadNeighbors.add('left')
	if (getCell(grid, chaletX + 1, chaletY) === '#') roadNeighbors.add('right')
	if (getCell(grid, chaletX, chaletY - 1) === '#') roadNeighbors.add('up')

	const priority: Direction[] = ['down', 'left', 'right', 'up']
	return priority.find((side) => roadNeighbors.has(side)) ?? null
}

function isRoadConnectedToDirection(grid: string[][], x: number, y: number, direction: Direction): boolean {
	const neighborX = direction === 'left' ? x - 1 : direction === 'right' ? x + 1 : x
	const neighborY = direction === 'up' ? y - 1 : direction === 'down' ? y + 1 : y
	const neighborCell = getCell(grid, neighborX, neighborY)

	if (neighborCell === '#') {
		return true
	}

	if (neighborCell !== 'c') {
		return false
	}

	const preferredSide = preferredChaletConnectionSide(grid, neighborX, neighborY)
	const candidateSide = oppositeDirection(direction)

	return preferredSide === candidateSide
}

export function getRoadTileVariant(grid: string[][], x: number, y: number): RoadTileVariant {
	const directions: Direction[] = []

	if (isRoadConnectedToDirection(grid, x, y, 'up')) directions.push('up')
	if (isRoadConnectedToDirection(grid, x, y, 'right')) directions.push('right')
	if (isRoadConnectedToDirection(grid, x, y, 'down')) directions.push('down')
	if (isRoadConnectedToDirection(grid, x, y, 'left')) directions.push('left')

	const key = directionSetKey(directions)

	if (directions.length === 4) {
		return { variant: 'crossing', rotation: 0 }
	}

	if (directions.length === 3) {
		const splitRotationByKey: Record<string, number> = {
			'down-right-up': 0,
			'down-left-right': ROTATION_90,
			'down-left-up': ROTATION_180,
			'left-right-up': ROTATION_270,
		}

		return {
			variant: 'split',
			rotation: splitRotationByKey[key] ?? 0,
		}
	}

	if (directions.length === 2) {
		const cornerRotationByKey: Record<string, number> = {
			'right-up': 0,
			'down-right': ROTATION_90,
			'down-left': ROTATION_180,
			'left-up': ROTATION_270,
		}

		if (key in cornerRotationByKey) {
			return {
				variant: 'corner',
				rotation: cornerRotationByKey[key],
			}
		}

		if (key === 'down-up') {
			return { variant: 'straight', rotation: 0 }
		}

		if (key === 'left-right') {
			return { variant: 'straight', rotation: ROTATION_90 }
		}

		return { variant: 'straight', rotation: 0 }
	}

	if (directions.length === 1) {
		const endRotationByDirection: Record<Direction, number> = {
			down: 0,
			left: ROTATION_90,
			up: ROTATION_180,
			right: ROTATION_270,
		}

		return {
			variant: 'end',
			rotation: endRotationByDirection[directions[0]],
		}
	}

	return { variant: 'end', rotation: 0 }
}

export function getTileRotation(symbol: string, mapData: MapResponse, x: number, y: number): number {
	if (symbol !== '#') {
		return 0
	}

	return getRoadTileVariant(mapData.grid, x, y).rotation
}

export function shouldUsePoolTexture(grid: string[][], x: number, y: number): boolean {
	return (
		getCell(grid, x, y - 1) === 'p' ||
		getCell(grid, x + 1, y) === 'p' ||
		getCell(grid, x, y + 1) === 'p' ||
		getCell(grid, x - 1, y) === 'p'
	)
}

export function getTileAsset(symbol: string, mapData: MapResponse, x: number, y: number): string {
	if (symbol === '#') {
		const roadTile = getRoadTileVariant(mapData.grid, x, y)
		return getRoadVariantAsset(roadTile.variant)
	}

	if (symbol === 'p') {
		return shouldUsePoolTexture(mapData.grid, x, y) ? textureWaterTile : poolTile
	}

	if (symbol === 'W') return cabanaTile
	if (symbol === 'c') return chaletTile
	return emptyTile
}
