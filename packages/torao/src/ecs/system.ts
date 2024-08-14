import { type AnyQuery, type FirstQuery, IS_FIRST, IS_REQUIRED } from './query'

type InferValues<TQueries extends Queries> = {
	[TKey in keyof TQueries]:
	TQueries[TKey] extends FirstQuery<any>
		? ReturnType<TQueries[TKey]['useFirst']>
		: ReturnType<TQueries[TKey]['use']>
}

type UpdateArgs<TValues> = {
	entities: TValues
}

/**
 * A system is a function that updates the state of the game.
 */
export type System = {
	label: string
	queries: Array<AnyQuery>
	run: () => void
}
type Queries = Record<string, AnyQuery>

type SystemArgs<TQueries extends Queries> = {
	label: string
	queries?: TQueries
	update: (args: UpdateArgs<InferValues<TQueries>>) => void
}

export function createSystem<TQueries extends Queries>(args: SystemArgs<TQueries>): System {
	const { label, queries, update } = args

	return {
		label,
		queries: Object.values(queries ?? {}),
		run() {
			const entities = {} as Partial<InferValues<TQueries>>

			for (const key in queries) {
				const query = queries[key]!
				const value = IS_FIRST in query ? query.useFirst() : query.use()

				if (IS_REQUIRED in query) {
					const isFullfilled = (Array.isArray(value) && value.length !== 0) || value !== undefined

					if (!isFullfilled) {
						return
					}
				}

				entities[key] = value as InferValues<TQueries>[typeof key]
			}

			update({ entities: entities as InferValues<TQueries> })
		},
	}
}
