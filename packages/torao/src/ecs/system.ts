import type { Query } from './query'
import type { Resource } from './resource'

/**
 * A system is a function that updates the state of the game.
 */
export type System = {
	label: string
	queries: Array<Query<unknown>>
	resources: Array<Resource<unknown>>
	update: () => void
}

type SystemArgs = {
	label: string
	queries?: Array<Query<unknown>>
	resources?: Array<Resource<unknown>>
	update: () => void
}

export function createSystem(args: SystemArgs): System {
	const { label, queries = [], resources = [], update } = args

	return {
		label,
		queries,
		resources,
		update,
	}
}
