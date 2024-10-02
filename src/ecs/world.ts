import type { Simplify } from 'type-fest'
import type { Entity } from './entity'
import { createRefBox, type RefBox } from '../boxes/ref-box'
import { map, set } from '../types'
import { type AnyQuery, defineQuery, type Query, type QueryArgs } from './query'

type QueryEntity<
	TEntity extends Entity,
	TSelect extends keyof TEntity,
> = Simplify<Required<Pick<TEntity, TSelect>>>

type UpdateFn<TEntity> = (values: TEntity) => TEntity

type UpdateArgs<TEntity extends Entity, TComponent extends keyof TEntity> =
	| [entity: TEntity, component: TComponent, value: TEntity[TComponent]]
	| [entity: TEntity, values: Partial<TEntity>]
	| [entity: TEntity, updater: UpdateFn<TEntity>]

export type AnyWorld = {
	spawn: Spawn<any>
	despawn: (entity: any) => void
	registerQuery: (args: Query<any>) => void
	select: Select<any>
	reset: () => void
	entities: RefBox<any>
	update: (...args: UpdateArgs<any, any>) => void
	remove: (entity: any, component: any) => void
	createQuery: (args: any) => Query<any>
}

export type Spawn<TEntity extends Entity> = (id: string, values: TEntity) => TEntity
export type Select<TEntity extends Entity> = <TExpectedEntity extends TEntity>(query: Query<TExpectedEntity>) => RefBox<QueryEntity<TEntity, keyof TExpectedEntity>>
export type World<
	TEntity extends Entity,
> = {
	spawn: Spawn<TEntity>
	despawn: (entity: TEntity) => void
	registerQuery: <TExpectedEntity extends TEntity>(args: Query<TExpectedEntity>) => void
	select: Select<TEntity>
	reset: () => void
	entities: RefBox<TEntity>
	update: <TComponent extends keyof TEntity>(...args: UpdateArgs<TEntity, TComponent>) => void
	remove: (entity: TEntity, component: keyof TEntity) => void
	createQuery: <TSelect extends keyof TEntity>(args: QueryArgs<QueryEntity<TEntity, TSelect>>) => Query<QueryEntity<TEntity, TSelect>>
}

export function createWorld<TEntity extends Entity>(): World<TEntity> {
	type TComponent = keyof TEntity
	type TQuery = Query<TEntity>
	const entities = createRefBox<TEntity>()
	const components = map<TComponent, Set<TQuery>>()
	const queries = map<TQuery, RefBox<TEntity>>()

	function addComponent(entity: TEntity, component: TComponent) {
		const queries = getQueries(component)

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

	function removeComponent(entity: TEntity, component: TComponent) {
		for (const query of components.get(component) || []) {
			removeEntity(entity, query)
		}
	}

	function getQueries(component: TComponent) {
		if (!components.has(component)) {
			components.set(component, set())
		}

		return components.get(component)!
	}

	function compute(query: Query<Required<TEntity>>) {
		const entitiesEntities = queries.get(query as AnyQuery)!
		for (const [id, entity] of entities.byId) {
			if (match(entity, query)) {
				entitiesEntities.add(id, entity)
			}
			else {
				entitiesEntities.remove(entity)
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

	function update<TUpdated extends TComponent>(...args: UpdateArgs<TEntity, TUpdated>): void {
		const [entity, valuesOrComponent, value] = args

		if (typeof valuesOrComponent === 'object') {
			for (const component in valuesOrComponent) {
				const value = valuesOrComponent[component]
				if (value === undefined) {
					remove(entity, component)
				}
				else {
					update(entity, component, value)
				}
			}
		}
		else if (typeof valuesOrComponent === 'function') {
			const values = valuesOrComponent({
				...entity,
			})

			for (const component in values) {
				update(entity, component, values[component])
			}
		}
		else {
			const component = valuesOrComponent

			if (value !== undefined) {
				entity[component] = value
				addComponent(entity, component)
			}
		}
	}

	function remove(entity: TEntity, component: TComponent) {
		const previousValue = entity[component]
		delete entity[component]

		if (previousValue !== undefined) {
			removeComponent(entity, component)
		}
	}

	function reset() {
		entities.clear()
	}

	function registerQuery<TExpectedEntity extends TEntity>(query: Query<TExpectedEntity>) {
		const worldQuery = query as TQuery
		for (const component of [...query.with, ...query.without]) {
			const queries = getQueries(component)
			queries.add(worldQuery)
		}

		queries.set(worldQuery, createRefBox())
		compute(worldQuery)
	}

	function createQuery<TSelect extends keyof TEntity>(args: QueryArgs<QueryEntity<TEntity, TSelect>>): Query<QueryEntity<TEntity, TSelect>> {
		const query = defineQuery(args)

		registerQuery(query as unknown as Query<TEntity>)

		return query
	}

	function select<TExpectedEntity extends TEntity>(query: Query<TExpectedEntity>) {
		if (!queries.has(query as AnyQuery)) {
			registerQuery(query)
		}

		const result = queries.get(query as AnyQuery) || createRefBox()
		return result as unknown as RefBox<QueryEntity<TEntity, keyof TExpectedEntity>>
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

function match<TEntity extends Entity>(entity: TEntity, query: Query<Required<TEntity>>) {
	const { with: withComponents, without: withoutComponents, where } = query
	for (const component of withComponents) {
		if (!(component in entity)) {
			return false
		}
	}

	for (const component of withoutComponents) {
		if (component in entity) {
			return false
		}
	}

	return !where || where(entity as Required<TEntity>)
}
