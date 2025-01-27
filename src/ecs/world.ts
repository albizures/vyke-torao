import { createRefBox, type RefBox } from '../boxes/ref-box'
import { map, set } from '../types'
import { type AnyEntity, type ComponentKey, getComponentId, hasComponent, type InferWithComponents, isMaybeComponent } from './entity'
import { type AnyComponents, defineQuery, type Query, type QueryArgs } from './query'

type UpdateFn<TEntity> = (values: TEntity) => TEntity

export type Spawn = (id: string, values: AnyEntity) => AnyEntity

export type Select = <
	TComponents extends AnyComponents,
>(query: Query<TComponents>) => RefBox<InferWithComponents<TComponents>>

type UpdateArgs =
	| [entity: AnyEntity, key: ComponentKey, value: unknown]
	| [entity: AnyEntity, values: Partial<AnyEntity>]
	| [entity: AnyEntity, updater: UpdateFn<AnyEntity>]

export type Update = (...args: UpdateArgs) => void

export type RegisterQuery = <
	TComponents extends AnyComponents,
>(args: Query<TComponents>) => void

export type CreateQuery = <
	const TComponents extends AnyComponents,
>(args: QueryArgs<TComponents>) => Query<TComponents>

export type World = {
	spawn: Spawn
	despawn: (entity: AnyEntity) => void
	registerQuery: RegisterQuery
	select: Select
	reset: () => void
	entities: RefBox
	update: Update
	remove: (entity: AnyEntity, key: ComponentKey) => void
	createQuery: CreateQuery
}

export function createWorld(): World {
	type TQuery = Query<AnyComponents>
	const entities = createRefBox<AnyEntity>()
	const components = map<ComponentKey, Set<TQuery>>()
	const queries = map<TQuery, RefBox>()

	function addComponent(entity: AnyEntity, key: ComponentKey) {
		const queries = getQueries(key)

		for (const query of queries) {
			processEntity(entity, query)
		}
	}

	function processEntity(entity: AnyEntity, query: TQuery) {
		const queryEntity = queries.get(query)!

		if (match(entity, query)) {
			const id = entities.getId(entity)
			if (id === undefined) {
				throw new Error('Unknown entity')
			}

			queryEntity.add(id, entity)
		}
		else {
			queryEntity.remove(entity)
		}
	}

	function removeEntity(entity: AnyEntity, query: TQuery) {
		const queryEntity = queries.get(query)!
		if (!queryEntity.has(entity)) {
			return
		}

		queryEntity.remove(entity)
	}

	function removeComponent(entity: AnyEntity, key: ComponentKey) {
		for (const query of components.get(key) || []) {
			removeEntity(entity, query)
		}
	}

	function getQueries(key: ComponentKey) {
		if (!components.has(key)) {
			components.set(key, set())
		}

		return components.get(key)!
	}

	function compute<TComponents extends AnyComponents>(query: Query<TComponents>) {
		const queryEntities = queries.get(query)!

		for (const [id, entity] of entities.byId) {
			if (match(entity, query)) {
				queryEntities.add(id, entity)
			}
			else {
				queryEntities.remove(entity)
			}
		}
	}

	function spawn(id: string, entity: AnyEntity): AnyEntity {
		if (entities.has(id)) {
			throw new Error(`Entity with id "${id}" already exists`)
		}

		entities.add(id, entity)

		for (const component in entity) {
			const queries = getQueries(component)

			for (const query of queries) {
				processEntity(entity, query)
			}
		}

		return entity
	}

	function despawn(entity: AnyEntity): void {
		if (entity) {
			entities.remove(entity)

			for (const component in entity) {
				removeComponent(entity, component)
			}
		}
	}

	function update(...args: UpdateArgs): void {
		const [entity, valuesOrName, value] = args

		if (typeof valuesOrName === 'object') {
			for (const component in valuesOrName) {
				const value = valuesOrName[component]
				if (value === undefined) {
					remove(entity, component)
				}
				else {
					update(entity, component, value)
				}
			}
		}
		else if (typeof valuesOrName === 'function') {
			const values = valuesOrName({
				...entity,
			})

			for (const component in values) {
				update(entity, component, values[component])
			}
		}
		else {
			const component = valuesOrName

			if (value !== undefined) {
				entity[component] = value
				addComponent(entity, component)
			}
		}
	}

	function remove(entity: AnyEntity, key: ComponentKey) {
		if (key) {
			const previousValue = entity[key]
			delete entity[key]

			if (previousValue !== undefined) {
				removeComponent(entity, key)
			}
		}
	}

	function reset() {
		entities.clear()
	}

	function registerQuery<TComponents extends AnyComponents>(query: Query<TComponents>) {
		for (const component of [...query.with, ...query.without]) {
			if (isMaybeComponent(component)) {
				continue
			}
			const id = getComponentId(component)

			const queries = getQueries(id)
			queries.add(query)
		}

		queries.set(query, createRefBox())
		compute(query)
	}

	function createQuery<const TComponents extends AnyComponents>(args: QueryArgs<TComponents>): Query<TComponents> {
		const query = defineQuery(args)

		registerQuery(query)

		return query
	}

	function select<TComponents extends AnyComponents>(query: Query<TComponents>) {
		if (!queries.has(query)) {
			registerQuery(query)
		}

		const result = queries.get(query) || createRefBox()

		return result as unknown as RefBox<InferWithComponents<TComponents>>
	}

	const world: World = {
		spawn,
		despawn,
		registerQuery,
		select,
		createQuery,
		reset,
		entities,
		update,
		remove,
	}

	return world
}

function match(entity: AnyEntity, query: Query<AnyComponents>) {
	const { with: withComponents, without: withoutComponents, where } = query
	for (const component of withComponents) {
		if (isMaybeComponent(component)) {
			continue
		}

		if (!(hasComponent(entity, component))) {
			return false
		}
	}

	for (const component of withoutComponents) {
		if (hasComponent(entity, component)) {
			return false
		}
	}

	return !where || where(entity)
}
