import { InvalidSystemTypeError } from '../error'
import { type AnyQuery, type FirstQuery, IS_FIRST, IS_REQUIRED, type RequiredFirstQuery } from './query'

type InferValues<TQueries extends Queries> = {
	[TKey in keyof TQueries]:
	TQueries[TKey] extends RequiredFirstQuery<any>
		? NonNullable<ReturnType<TQueries[TKey]['useFirst']>>
	 	: TQueries[TKey] extends FirstQuery<any>
			? ReturnType<TQueries[TKey]['useFirst']>
			: ReturnType<TQueries[TKey]['use']>
}

type SystemFnArgs<TValues> = {
	entities: TValues
}

/**
 * A system is a function that updates the state of the game.
 */
export type System = {
	id: string
	queries: Array<AnyQuery>
	run: () => void
	type: SystemType
}
type Queries = Record<string, AnyQuery>

export enum SystemType {
	FixedUpdate = 0,
	Update = 1,
	Render = 2,
	Setup = 3,
	EnterScene = 4,
	BeforeFrame = 5,
	AfterFrame = 6,
}

type SystemFn<TEntities> = (args: SystemFnArgs<TEntities>) => void

type SystemArgs<TQueries extends Queries> = {
	id: string
	queries?: TQueries
	type: SystemType
	fn: SystemFn<InferValues<TQueries>>
}

export function createSystem<TQueries extends Queries>(args: SystemArgs<TQueries>): System {
	const { id, queries, fn, type } = args

	return {
		id,
		type,
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

			fn({
				entities: entities as InferValues<TQueries>,
			})
		},
	}
}
