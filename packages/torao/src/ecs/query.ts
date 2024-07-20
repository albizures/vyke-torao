import type { AnyComponent, Component } from './component'
import type { Entity } from './entity'

const IS_NOT = Symbol('isNot')

/**
 * A query that requires a component not to be present on an entity.
 */
type QueryNot<TComponent extends AnyComponent> = {
	[IS_NOT]: true
	component: TComponent
}
/**
 * Creates a query that requires a component not to be present on an entity.
 */
export function Not<TComponent extends AnyComponent>(component: TComponent): QueryNot<TComponent> {
	return {
		[IS_NOT]: true,
		component,
	}
}

function isQueryNot(value: object): value is QueryNot<AnyComponent> {
	return IS_NOT in value
}

type QueryParams = Record<string, AnyComponent | QueryNot<AnyComponent>>

type InferQueryResultValues<TParams extends QueryParams> = {
	[TKey in keyof TParams]: TParams[TKey] extends Component<infer TInstance, any>
		? TInstance
		: never
}

type QueryResult<TResultValues> = {
	entity: Entity
	values: TResultValues
}

/**
 * A query that can be used to filter entities based on their components.
 */
export type Query<TResultValues> = {
	label: string
	compute: (entries: Array<Entity>) => Array<QueryResult<TResultValues>>
	get: () => Array<QueryResult<TResultValues>>
}

type QueryArgs<TParams extends QueryParams> = {
	label: string
	params: TParams
}

/**
 * Creates a query that can be used to filter entities based on their components.
 */
export function createQuery<TParams extends QueryParams>(args: QueryArgs<TParams>): Query<InferQueryResultValues<TParams>> {
	const { params, label } = args
	const values = Object.entries(params)
	const components = new Set<AnyComponent>()
	const notComponents = new Set<AnyComponent>()

	for (const [,value] of values) {
		if (isQueryNot(value)) {
			notComponents.add(value.component)

			if (components.has(value.component)) {
				throw new Error(`Component "${value.component.label}" cannot be both required and excluded`)
			}
		}
		else {
			components.add(value)

			if (notComponents.has(value)) {
				throw new Error(`Component "${value.label}" cannot be both required and excluded`)
			}
		}
	}

	type ResultValue = InferQueryResultValues<TParams>

	let results: Array<QueryResult<ResultValue>> = []

	function compute(entities: Array<Entity>) {
		const update: Array<QueryResult<Record<string, any>>> = []

		for (const entity of entities) {
			let valid = true

			for (const component of components) {
				if (!entity.getComponent(component)) {
					valid = false
					break
				}
			}

			for (const component of notComponents) {
				if (entity.getComponent(component)) {
					valid = false
					break
				}
			}

			if (valid) {
				const result: QueryResult<Record<string, any>> = {
					entity,
					values: {},
				}

				for (const [key, value] of values) {
					if (!isQueryNot(value)) {
						result.values[key] = entity.getComponent(value)
					}
				}

				update.push(result)
			}
		}

		results = update as Array<QueryResult<ResultValue>>

		return results
	}

	return {
		label,
		compute,
		get() {
			return results
		},
	}
}
