/* eslint-disabl e no-console */
import { createRefBox, type RefBox } from '../boxes/ref-box'
import { map, set } from '../types'
import { type AnyEntity, type ComponentId, getComponentId, hasComponent, type InferWithComponents } from './entity'
import { type AnyComponents, defineQuery, type Query, type QueryArgs } from './query'

type UpdateFn<TEntity> = (values: TEntity) => TEntity

type UpdateArgs<TEntity extends AnyEntity, TComponentName extends keyof TEntity> =
	| [entity: TEntity, componentName: TComponentName, value: TEntity[TComponentName]]
	| [entity: TEntity, values: Partial<TEntity>]
	| [entity: TEntity, updater: UpdateFn<TEntity>]

export type Spawn<TEntity extends AnyEntity> = (id: string, values: TEntity) => TEntity

export type Select = <
	TComponents extends AnyComponents,
>(query: Query<TComponents>) => RefBox<InferWithComponents<TComponents>>

export type Update<TEntity extends AnyEntity> = <
	TComponent extends keyof TEntity,
>(...args: UpdateArgs<TEntity, TComponent>) => void

export type RegisterQuery = <
	TComponents extends AnyComponents,
>(args: Query<TComponents>) => void

export type CreateQuery = <
	TComponents extends AnyComponents,
	// spread operator allows to infer TComponents as a tuple
>(args: QueryArgs<[...TComponents]>) => Query<[...TComponents]>

export type World<
	TEntity extends AnyEntity,
> = {
	spawn: Spawn<TEntity>
	despawn: (entity: TEntity) => void
	registerQuery: RegisterQuery
	select: Select
	reset: () => void
	entities: RefBox<TEntity>
	update: Update<TEntity>
	remove: (entity: TEntity, componentName: keyof TEntity) => void
	createQuery: CreateQuery
}

export function createWorld<TEntity extends AnyEntity>(): World<TEntity> {
	type TComponentName = ComponentId
	type TQuery = Query<AnyComponents>
	const entities = createRefBox<TEntity>()
	const components = map<TComponentName, Set<TQuery>>()
	const queries = map<TQuery, RefBox<TEntity>>()

	function addComponent(entity: TEntity, componentName: TComponentName) {
		const queries = getQueries(componentName)

		for (const query of queries) {
			processEntity(entity, query)
		}
	}

	function processEntity(entity: TEntity, query: TQuery) {
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

	function removeEntity(entity: TEntity, query: TQuery) {
		const queryEntity = queries.get(query)!
		if (!queryEntity.has(entity)) {
			return
		}

		queryEntity.remove(entity)
	}

	function removeComponent(entity: TEntity, component: TComponentName) {
		for (const query of components.get(component) || []) {
			removeEntity(entity, query)
		}
	}

	function getQueries(component: TComponentName) {
		if (!components.has(component)) {
			components.set(component, set())
		}

		return components.get(component)!
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

	function spawn(id: string, values: TEntity): TEntity {
		const entity: TEntity = values

		if (entities.has(id)) {
			throw new Error(`Entity with id "${id}" already exists`)
		}

		entities.add(id, entity)

		for (const component in values) {
			const queries = getQueries(component)

			for (const query of queries) {
				processEntity(entity, query)
			}
		}

		return entity
	}

	function despawn(entity: TEntity) {
		if (entity) {
			entities.remove(entity)

			for (const component in entity) {
				removeComponent(entity, component)
			}
		}
	}

	function update<TUpdated extends TComponentName>(...args: UpdateArgs<TEntity, TUpdated>): void {
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

	function remove(entity: TEntity, componentName: TComponentName) {
		if (componentName) {
			const previousValue = entity[componentName]
			delete entity[componentName]

			if (previousValue !== undefined) {
				removeComponent(entity, componentName)
			}
		}
	}

	function reset() {
		entities.clear()
	}

	function registerQuery<TComponents extends AnyComponents>(query: Query<TComponents>) {
		for (const component of [...query.with, ...query.without]) {
			const id = getComponentId(component)

			if (id) {
				const queries = getQueries(id)
				queries.add(query)
			}
		}

		queries.set(query, createRefBox())
		compute(query)
	}

	function createQuery<TComponents extends AnyComponents>(args: QueryArgs<[...TComponents]>): Query<[...TComponents]> {
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

	const world: World<TEntity> = {
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
