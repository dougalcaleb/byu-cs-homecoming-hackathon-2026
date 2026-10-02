import type { JobPosting } from '../../../shared/types'
import { fetchAshbyBoard } from './ashby'
import type { Board, BoardProvider, SearchProvider } from './common'
import { fetchGreenhouseBoard } from './greenhouse'
import { jsearch } from './jsearch'
import { fetchLeverBoard } from './lever'
import { serpapi } from './serpapi'

export type { Board, SearchProvider, SearchQuery } from './common'

const boardFetchers: Record<BoardProvider, (board: Board) => Promise<JobPosting[]>> = {
	greenhouse: fetchGreenhouseBoard,
	lever: fetchLeverBoard,
	ashby: fetchAshbyBoard,
}

export function fetchBoard(board: Board) {
	return boardFetchers[board.provider](board)
}

// In order of preference; the first configured one is used
const searchProviders: SearchProvider[] = [jsearch, serpapi]

export function activeSearchProvider(): SearchProvider | undefined {
	return searchProviders.find((provider) => provider.isConfigured())
}
