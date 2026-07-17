import { useEffect, useMemo, useState } from 'react'
import emptyTile from '../../assets/parchmentBasic.png'
import './cabanaMap.css'
import {
	buildCabanaLookup,
	fetchMapData,
	getTileAsset,
	getTileRotation,
	type MapResponse,
} from './cabanaMapServices.ts'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export default function CabanaMap() {
	const [mapData, setMapData] = useState<MapResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [cabanaMessage, setCabanaMessage] = useState('Tap a cabana to check availability.')

	useEffect(() => {
		async function loadMap() {
			setLoading(true)
			setErrorMessage(null)

			try {
				const payload = await fetchMapData(API_BASE_URL)
				setMapData(payload)
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown map loading error'
				setErrorMessage(message)
			} finally {
				setLoading(false)
			}
		}

		void loadMap()
	}, [])

	const cabanaByCoordinate = useMemo(() => buildCabanaLookup(mapData), [mapData])

	function handleCabanaClick(x: number, y: number) {
		const cabana = cabanaByCoordinate.get(`${x},${y}`)
		if (!cabana) {
			return
		}

		setCabanaMessage(
			cabana.isBooked
				? `Cabana ${cabana.id} is currently unavailable.`
				: `Cabana ${cabana.id} is available. Booking form comes in Step 2.`,
		)
	}

	const columns = mapData?.grid[0]?.length ?? 0

	return (
		<main className="app">
			<header className="appHeader">
				<p className="kicker">Luxury Resort</p>
				<h1>Cabana Booking Map</h1>
				<p className="subtitle">Live resort board map with functionality to book your desired cabana.</p>
			</header>

			<section className="mapSection">
				{loading && <p className="status">Loading map...</p>}
				{errorMessage && <p className="status error">Could not load map: {errorMessage}</p>}

				{!loading && !errorMessage && mapData && (
					<div className="boardWrap">
						<div
							className="board"
							style={{
								gridTemplateColumns: `repeat(${columns}, var(--tile-size))`,
								backgroundImage: `url(${emptyTile})`,
							}}
						>
							{mapData.grid.map((row, y) =>
								row.map((cell, x) => {
									const cabana = cabanaByCoordinate.get(`${x},${y}`)
									const isCabana = cell === 'W' && cabana
									const tileClassName = [
										'tile',
										isCabana ? 'isCabana' : '',
										isCabana && cabana.isBooked ? 'isBooked' : '',
									]
										.filter(Boolean)
										.join(' ')

									return (
										<button
											key={`${x}-${y}`}
											type="button"
											className={tileClassName}
											onClick={() => (isCabana ? handleCabanaClick(x, y) : undefined)}
											disabled={!isCabana}
											aria-label={isCabana ? `Cabana ${cabana.id}` : `Tile ${cell}`}
										>
											{cell !== '.' && (
												<img
													src={getTileAsset(cell, mapData, x, y)}
													alt=""
													draggable={false}
													style={{ transform: `rotate(${getTileRotation(cell, mapData, x, y)}deg)` }}
												/>
											)}
											{isCabana && cabana.isBooked && <span className="bookedBadge">Booked</span>}
										</button>
									)
								}),
							)}
						</div>
					</div>
				)}

				<p className="status">{cabanaMessage}</p>
			</section>
		</main>
	)
}
