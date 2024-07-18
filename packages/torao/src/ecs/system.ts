import type { Query } from './query'

export type System = {
	queries: Array<Query<unknown>>
	update: () => void
}
