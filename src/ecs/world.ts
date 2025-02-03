import type { RefBox } from '../boxes/ref-box'
import type { AnyEntity, ComponentKey, InferWithComponents } from './entity'
import type { AnyCreators, Query, QueryArgs } from './query'
import { createRefBox } from '../boxes/ref-box'
import { assert } from '../error'
import { map, set } from '../types'
import { hasComponent, isMaybe } from './entity'

type UpdateFn<TEntity> = (values: TEntity) => TEntity

export type Spawn<TEntity = AnyEntity> = (id: string, values: TEntity) => AnyEntity

export type Select = <
	TCreators extends AnyCreators,
>(query: Query<TCreators>) => RefBox<InferWithComponents<TCreators>>

type UpdateArgs =
	| [entity: AnyEntity, key: ComponentKey, value: unknown]
	| [entity: AnyEntity, values: Partial<AnyEntity>]
	| [entity: AnyEntity, updater: UpdateFn<AnyEntity>]

export type Update = (...args: UpdateArgs) => void

type RegisterQuery = <
	TCreator extends AnyCreators,
>(args: Query<TCreator>) => void

export type World = {
	spawn: Spawn
	despawn: (entity: AnyEntity) => void
	registerQuery: RegisterQuery
	select: Select
	reset: () => void
	entities: RefBox
	update: Update
	remove: (entity: AnyEntity, key: ComponentKey) => void
}

export function createWorld(): World {
	type TQuery = Query<AnyCreators>
	const entities = createRefBox<AnyEntity>()
	const components = map<ComponentKey, Set<TQuery>>()
	const queries = map<TQuery, RefBox>()

	function updateByComponent(entityId: string, key: ComponentKey) {
		const queries = getQueries(key)

		for (const query of queries) {
			processEntity(entityId, query)
		}
	}

	function processEntity(id: string, query: TQuery) {
		const queryEntities = queries.get(query)!
		const entity = entities.getById(id)

		assert(entity, 'Entity not found')
		if (match(entity, query)) {
			queryEntities.add(id, entity)
		}
		else {
			queryEntities.remove(id)
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

	function compute<TCreator extends AnyCreators>(query: Query<TCreator>) {
		for (const [id] of entities.byId) {
			processEntity(id, query)
		}
	}

	function spawn(id: string, entity: AnyEntity): AnyEntity {
		assert(!entities.has(id), `Entity with id "${id}" already exists`)

		entities.add(id, entity)

		for (const component in entity) {
			const queries = getQueries(component)

			for (const query of queries) {
				processEntity(id, query)
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
		const id = entities.getId(entity)

		assert(id, 'Entity not found')

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
				updateByComponent(id, component)
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

	function registerQuery<TCreators extends AnyCreators>(query: Query<TCreators>) {
		for (const creator of [...query.with, ...query.without]) {
			if (isMaybe(creator)) {
				continue
			}

			const queries = getQueries(creator.componentName)
			queries.add(query)
		}

		queries.set(query, createRefBox())
		compute(query)
	}

	function select<TCreator extends AnyCreators>(query: Query<TCreator>) {
		if (!queries.has(query)) {
			registerQuery(query)
		}

		const result = queries.get(query) || createRefBox()

		return result as unknown as RefBox<InferWithComponents<TCreator>>
	}

	const world: World = {
		spawn,
		despawn,
		registerQuery,
		select,
		reset,
		entities,
		update,
		remove,
	}

	return world
}

function match(entity: AnyEntity, query: Query<AnyCreators>) {
	const { with: withComponents, without: withoutCreatorTCreator, where } = query
	for (const component of withComponents) {
		if (isMaybe(component)) {
			continue
		}

		if (!(hasComponent(entity, component))) {
			return false
		}
	}

	for (const component of withoutCreatorTCreator) {
		if (hasComponent(entity, component)) {
			return false
		}
	}

	return !where || where(entity)
}
