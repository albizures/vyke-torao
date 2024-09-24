import type { Entity } from './entity'
import { type AnyComponent, type Component, getComponent } from './component'

export type AnyQuery = Query<any>

export type InferValues<TParams extends QueryParams> = {
	[TKey in keyof TParams]: TParams[TKey] extends Component<infer TInstance, any>
		? TInstance
		: never
}

type QueryListener<TParams extends QueryParams> = (query: Query<TParams>) => void
export type QueryParams = Record<string, AnyComponent>
type QueryFilter = { component: AnyComponent } & ({ type: 'with' } | { type: 'without' })
export type QueryResult<TResultValues> = {
	entity: Entity
	values: TResultValues
}

export type Query<TParams extends QueryParams> = {
	id: string
	listeners: Set<QueryListener<TParams>>
	params: TParams
	with: Set<AnyComponent>
	without: Set<AnyComponent>
	results: Map<Entity, QueryResult<InferValues<TParams>>>
	first?: boolean
	required?: boolean
}

type QueryArgs<TParams extends QueryParams> = {
	id: string
	params: TParams
	filters?: Array<QueryFilter>
}

export function createQuery<TParams extends QueryParams>(args: QueryArgs<TParams>): Query<TParams> {
	const { id, params, filters = [] } = args

	type ResultValue = InferValues<TParams>
	const results = new Map<Entity, QueryResult<ResultValue>>()

	const query: Query<TParams> = {
		id,
		params,
		listeners: new Set<QueryListener<TParams>>(),
		results,
		with: new Set([
			...Object.values(params),
			...filters.filter(isWith).map(({ component }) => component),
		]),
		without: new Set(filters.filter(isWithout).map(({ component }) => component)),
	}

	for (const component of [...query.with, ...query.without]) {
		component.queries.add(query)
	}

	return query
}

export function updateListeners<TParams extends QueryParams>(query: Query<TParams>) {
	const { listeners } = query
	for (const listener of listeners) {
		listener(query)
	}
}

export function compute<TParams extends QueryParams>(query: Query<TParams>, entities: Array<Entity>): Array<QueryResult<InferValues<TParams>>> {
	const { results } = query
	for (const entity of entities) {
		const result = getValuesFrom(query, entity)

		if (result) {
			results.set(entity, result)
		}
		else {
			results.delete(entity)
		}
	}

	return Array.from(results.values())
}

function match(entity: Entity, query: AnyQuery) {
	const { with: withComponents, without: withoutComponents } = query
	for (const component of withComponents) {
		if (!getComponent(entity, component)) {
			return false
		}
	}

	for (const component of withoutComponents) {
		if (getComponent(entity, component)) {
			return false
		}
	}

	return true
}

/**
 * Extracts the values from the entity only if it passes the filters
 * If not it returns undefined
 */
export function getValuesFrom<TParams extends QueryParams>(query: Query<TParams>, entity: Entity): QueryResult<InferValues<TParams>> | undefined {
	type ResultValue = InferValues<TParams>
	const { params } = query

	// let's get the values from valid entities
	// and store them in the result
	if (match(entity, query)) {
		const values = Object.entries(params)
		const result: QueryResult<Record<string, any>> = {
			entity,
			values: {},
		}

		for (const [key, value] of values) {
			result.values[key] = getComponent(entity, value)
		}

		return result as QueryResult<ResultValue>
	}

	return undefined
}

function isWithout(filter: QueryFilter): boolean {
	return filter.type === 'without'
}

function isWith(filter: QueryFilter): boolean {
	return filter.type === 'with'
}

export type Required = { required: true }

export function required<TQuery extends Query<any>>(query: TQuery): TQuery & Required {
	return {
		...query,
		required: true,
	}
}

export type First = { first: true }

export function first<TQuery extends Query<any>>(query: TQuery): TQuery & First {
	return {
		...query,
		first: true,
	}
}
