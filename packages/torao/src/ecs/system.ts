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

type UpdateArgs<TValues> = {
	entities: TValues
	deltaTime: number
	fps: number
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
}

type SystemFn = (args: UpdateArgs<any>) => void

type SystemFns =
	| { fixedUpdate: SystemFn }
	| { update: SystemFn }
	| { render: SystemFn }

type RunArgs = {
	deltaTime: number
	fps: number
}

type SystemArgs<TQueries extends Queries> = SystemFns & {
	id: string
	queries?: TQueries
}

export function createSystem<TQueries extends Queries>(args: SystemArgs<TQueries>): System {
	const { id, queries } = args

	const { fn, type } = extraTypeAndFn()

	function extraTypeAndFn() {
		if ('fixedUpdate' in args) {
			return {
				fn: args.fixedUpdate,
				type: SystemType.FixedUpdate,
			}
		}
		else if ('update' in args) {
			return {
				fn: args.update,
				type: SystemType.Update,
			}
		}
		else if ('render' in args) {
			return {
				fn: args.render,
				type: SystemType.Render,
			}
		}

		throw new InvalidSystemTypeError('unknown')
	}

	return {
		id,
		type,
		queries: Object.values(queries ?? {}),
		run(args: RunArgs) {
			const { deltaTime, fps } = args
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
				deltaTime,
				fps,
				entities: entities as InferValues<TQueries>,
			})
		},
	}
}
