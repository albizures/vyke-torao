import type { Query } from './query'
import type { Resource } from './resource'

/**
 * A system is a function that updates the state of the game.
 */
export type System = {
	queries: Array<Query<unknown>>
	resources: Array<Resource<unknown>>
	update: () => void
}
