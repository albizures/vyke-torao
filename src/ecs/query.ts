import type { AnyComponent, Component } from './component'
import type { Entity } from './entity'

export const IS_NOT = Symbol('isNot')
export const IS_REQUIRED = Symbol('isRequired')
export const IS_FIRST = Symbol('isFirst')

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
	id: string
	compute: (entries: Array<Entity>) => Array<QueryResult<TResultValues>>
	use: () => Array<QueryResult<TResultValues>>
	useFirst: () => QueryResult<TResultValues> | undefined
	removeEntity: (entity: Entity) => void
	addEntity: (entity: Entity) => void
	required: () => RequiredQuery<TResultValues>
	first: () => FirstQuery<TResultValues>
}

export type RequiredQuery<TResultValues> = Omit<Query<TResultValues>, 'first'> & {
	[IS_REQUIRED]: true
	first: () => RequiredFirstQuery<TResultValues>
}

export type FirstQuery<TResultValues> = Omit<Query<TResultValues>, 'required'> & {
	[IS_FIRST]: true
	required: () => RequiredFirstQuery<TResultValues>
}

export type RequiredFirstQuery<TResultValues> = FirstQuery<TResultValues> & RequiredQuery<TResultValues>

export type AnyQuery = Query<any>

type QueryArgs<TParams extends QueryParams> = {
	id: string
	params: TParams
}

/**
 * Creates a query that can be used to filter entities based on their components.
 */
export function createQuery<TParams extends QueryParams>(args: QueryArgs<TParams>): Query<InferQueryResultValues<TParams>> {
	const { params, id } = args
	const values = Object.entries(params)
	const components = new Set<AnyComponent>()
	const notComponents = new Set<AnyComponent>()

	for (const [,value] of values) {
		if (isQueryNot(value)) {
			notComponents.add(value.component)

			if (components.has(value.component)) {
				throw new Error(`Component "${value.component.id}" cannot be both required and excluded`)
			}
		}
		else {
			components.add(value)

			if (notComponents.has(value)) {
				throw new Error(`Component "${value.id}" cannot be both required and excluded`)
			}
		}
	}

	type ResultValue = InferQueryResultValues<TParams>

	let results = new Map<Entity, QueryResult<ResultValue>>()
	let arrayResults: Array<QueryResult<ResultValue>> = []

	const query: Query<InferQueryResultValues<TParams>> = {
		id,
		compute,
		use() {
			return arrayResults
		},
		useFirst() {
			return arrayResults[0]
		},
		removeEntity(entity) {
			if (!results.has(entity)) {
				return
			}

			results.delete(entity)
			// this could be optimized by batching the removals
			// and recomputing the results only once
			// same for addEntity
			arrayResults = Array.from(results.values())
		},
		addEntity(entity) {
			const result = getResultFrom(entity)

			if (result) {
				results.set(entity, result)
				arrayResults = Array.from(results.values())
			}
			else {
				results.delete(entity)
			}
		},
		required() {
			return createRequiredQuery(args)
		},
		first() {
			return createFirstQuery(args)
		},
	}

	/**
	 * Returns the result of the query for a given entity.
	 * If the entity does not match the query, returns undefined.
	 */
	function getResultFrom(entity: Entity): QueryResult<ResultValue> | void {
		let valid = true
		for (const component of components) {
			if (!entity.getComponent(component)) {
				valid = false
				component.queries.delete(query)
				break
			}
			else {
				component.queries.add(query)
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

			return result as QueryResult<ResultValue>
		}
	}

	function compute(entities: Array<Entity>) {
		for (const entity of entities) {
			const result = getResultFrom(entity)

			if (result) {
				results.set(entity, result)
			}
			else {
				results.delete(entity)
			}
		}

		arrayResults = Array.from(results.values())

		return arrayResults
	}

	for (const component of components) {
		component.queries.add(query)
	}

	return query
}

function createRequiredQuery<TParams extends QueryParams>(args: QueryArgs<TParams>): RequiredQuery<InferQueryResultValues<TParams>> {
	const query = createQuery(args)
	return {
		...query,
		[IS_REQUIRED]: true,
		first() {
			return createRequiredFirstQuery(args)
		},
	}
}

function createFirstQuery<TParams extends QueryParams>(args: QueryArgs<TParams>): FirstQuery<InferQueryResultValues<TParams>> {
	const query = createQuery(args)
	return {
		...query,
		[IS_FIRST]: true,
		required() {
			return createRequiredFirstQuery(args)
		},
	}
}

export function createRequiredFirstQuery<TParams extends QueryParams>(args: QueryArgs<TParams>): RequiredFirstQuery<InferQueryResultValues<TParams>> {
	const query: RequiredFirstQuery<InferQueryResultValues<TParams>> = {
		...createQuery(args),
		[IS_FIRST]: true,
		[IS_REQUIRED]: true,
		required() {
			return {
				...query,
			}
		},
		first() {
			return {
				...query,
			}
		},
	}

	return query
}
