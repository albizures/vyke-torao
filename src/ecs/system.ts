import type { Entity, EntityArgs } from './entity'
import type { AnyQuery, First, InferValues, Query, QueryResult } from './query'

type InferSystemValue<TQuery> = TQuery extends Query<infer TParams>
	? TQuery extends First
		? QueryResult<NonNullable<InferValues<TParams>>>
		: Array<QueryResult<InferValues<TParams>>>
	: never

type InferSystemValues<TQueries extends Queries> = {
	[TKey in keyof TQueries]: InferSystemValue<TQueries[TKey]>
}

export type SystemFnArgs<TValues> = {
	entities: TValues
	spawn: (args: EntityArgs) => Entity
}

type RunArgs = {
	spawn: (args: EntityArgs) => Entity
}

/**
 * A system is a function that updates the state of the game.
 */
export type System = {
	id: string
	queries: Array<AnyQuery>
	run: (args: RunArgs) => void
	type: SystemType
}

type Queries = Record<string, AnyQuery>

export enum SystemType {
	FixedUpdate = 0,
	Update = 1,
	Render = 2,
	EnterScene = 3,
	BeforeFrame = 4,
	AfterFrame = 5,
}

type SystemFn<TEntities> = (args: SystemFnArgs<TEntities>) => void

type SystemArgs<TQueries extends Queries> = {
	id: string
	queries?: TQueries
	type: SystemType
	fn: SystemFn<InferSystemValues<TQueries>>
}

export function createSystem<TQueries extends Queries>(args: SystemArgs<TQueries>): System {
	const { id, queries, fn, type } = args

	return {
		id,
		type,
		queries: Object.values(queries ?? {}),
		run(args: RunArgs) {
			const entities = {} as Partial<InferSystemValues<TQueries>>

			for (const key in queries) {
				const query = queries[key]!
				const values = [...query.results.values()]
				const value = query.first ? values[0] : values

				if (query.required) {
					const isFulfilled = (Array.isArray(value) && value.length !== 0) || value !== undefined

					if (!isFulfilled) {
						return
					}
				}

				entities[key] = value as InferSystemValues<TQueries>[keyof TQueries]
			}

			fn({
				entities: entities as InferSystemValues<TQueries>,
				...args,
			})
		},
	}
}
