// #region Entity
export type Entity = {
	id: string
	components: Map<AnyComponent, Instance>
}

export type EntityArgs = {
	id: string
	components: Array<[AnyComponent, Instance]>
}

export function createEntity(args: EntityArgs): Entity {
	const { id, components: componentEntries } = args

	const entity: Entity = {
		id,
		components: new Map(),
	}

	for (const [component, instance] of componentEntries) {
		addComponent(entity, component, instance)
	}

	return entity
}

// #endregion

// #region Component
type AnyComponent = Component<any, any>
type Instance = Record<string, any>

type Component<TInstance extends Instance, TArgs> = {
	id: string
	create: (args: TArgs) => TInstance
	queries: Set<AnyQuery>
}

type ComponentArgs<TInstance extends Instance, TArgs> = {
	id: string
	create?: (args: TArgs) => TInstance
}

export function createComponent<
	TInstance extends Instance = Record<string, unknown>,
	TArgs = TInstance,
>(args: ComponentArgs<TInstance, TArgs>): Component<TInstance, TArgs> {
	const defaultCreate = (args: TArgs) => ({
		...args,
	}) as unknown as TInstance
	const { id, create = defaultCreate } = args

	const component: Component<TInstance, TArgs> = {
		id,
		queries: new Set<AnyQuery>(),
		create,
	}

	return component
}

export function entryFrom<TInstance extends Instance, TArgs>(
	component: Component<TInstance, TArgs>,
	args: TArgs,
): [Component<TInstance, TArgs>, TInstance] {
	const { create } = component
	return [
		component,
		create(args),
	]
}

// #endregion

// #region Query
type AnyQuery = Query<any>

type InferValues<TParams extends QueryParams> = {
	[TKey in keyof TParams]: TParams[TKey] extends Component<infer TInstance, any>
		? TInstance
		: never
}

type QueryListener<TParams extends QueryParams> = (query: Query<TParams>) => void
type QueryParams = Record<string, AnyComponent>
type QueryFilter = { component: AnyComponent } & ({ type: 'with' } | { type: 'without' })
type QueryResult<TResultValues> = {
	entity: Entity
	values: TResultValues
}

type Query<TParams extends QueryParams> = {
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

export function createQuery<TParams extends QueryParams>(args: QueryArgs<TParams>) {
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

function updateListeners<TParams extends QueryParams>(query: Query<TParams>) {
	const { listeners } = query
	for (const listener of listeners) {
		listener(query)
	}
}

export function compute<TParams extends QueryParams>(query: Query<TParams>, entities: Array<Entity>) {
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
function getValuesFrom<TParams extends QueryParams>(query: Query<TParams>, entity: Entity) {
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

type Required = { required: true }

export function required<TQuery extends Query<any>>(query: TQuery): TQuery & Required {
	return {
		...query,
		required: true,
	}
}

type First = { first: true }

export function first<TQuery extends Query<any>>(query: TQuery): TQuery & First {
	return {
		...query,
		first: true,
	}
}

// #endregion

// #region Common

export function addEntity<TParams extends QueryParams>(query: Query<TParams>, entity: Entity) {
	const { results } = query
	const result = getValuesFrom(query, entity)

	if (result) {
		results.set(entity, result)
		// arrayResults = Array.from(results.values())
	}
	else {
		results.delete(entity)
	}

	updateListeners(query)
}

export function removeEntity<TParams extends QueryParams>(query: Query<TParams>, entity: Entity) {
	const { results } = query
	if (!results.has(entity)) {
		return
	}

	results.delete(entity)
	// this could be optimized by batching the removals
	// and recomputing the results only once
	// same for addEntity
	// arrayResults = Array.from(results.values())
	updateListeners(query)
}

export function removeComponent(entity: Entity, component: AnyComponent) {
	const { queries } = component
	entity.components.delete(component)
	for (const query of queries) {
		removeEntity(query, entity)
	}
}

export function addComponent<TInstance extends Instance, TArgs>(entity: Entity, component: Component<TInstance, TArgs>, args: TArgs) {
	const { components } = entity
	const { queries } = component

	components.set(component, component.create(args))

	for (const query of queries) {
		addEntity(query, entity)
	}
}

export function getComponent<TInstance extends Instance, TArgs>(entity: Entity, component: Component<TInstance, TArgs>) {
	const { components } = entity
	return components.get(component) as TInstance | undefined
}

export function setComponent<TInstance extends Instance, TArgs>(entity: Entity, component: Component<TInstance, TArgs>, value: Partial<TInstance>) {
	const { components } = entity
	const { queries } = component

	components.set(component, {
		...components.get(component),
		...value,
	})

	for (const query of queries) {
		addEntity(query, entity)
	}
}

// #endregion

// #region System
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
					const isFullfilled = (Array.isArray(value) && value.length !== 0) || value !== undefined

					if (!isFullfilled) {
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

// #endregion
