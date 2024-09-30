import type { Simplify } from 'type-fest'
import type { AnyQuery, Query } from './query'
import { map, set } from '../types'

export type Component = string | number | symbol
export type Entity = Record<Component, any>

type SelectedValues<
	TEntity extends Entity,
	TSelect extends keyof TEntity,
> = Simplify<Required<Pick<TEntity, TSelect>>>

type UpdateFn<TEntity> = (values: TEntity) => TEntity

type UpdateArgs<TEntity extends Entity, TComponent extends keyof TEntity> =
	| [entity: TEntity, component: TComponent, value: TEntity[TComponent]]
	| [entity: TEntity, values: Partial<TEntity>]
	| [entity: TEntity, updater: UpdateFn<TEntity>]

export type Spawn<TEntity extends Entity> = (id: string, values: TEntity) => TEntity
export type Select<TEntity extends Entity> = <TExpectedEntity extends TEntity>(query: Query<TExpectedEntity>) => EntityBox<SelectedValues<TEntity, keyof TExpectedEntity>>
export type World<TEntity extends Entity> = {
	spawn: Spawn<TEntity>
	despawn: (entity: TEntity) => void
	registerQuery: <TExpectedEntity extends TEntity>(args: Query<TExpectedEntity>) => void
	select: Select<TEntity>
	reset: () => void
	entities: EntityBox<TEntity>
	update: <TComponent extends keyof TEntity>(...args: UpdateArgs<TEntity, TComponent>) => void
	remove: (entity: TEntity, component: keyof TEntity) => void
}

export function createWorld<TEntity extends Entity>(): World<TEntity> {
	type TComponent = keyof TEntity
	type TQuery = Query<TEntity>
	const entities = createEntityBox<TEntity>()
	const components = map<TComponent, Set<TQuery>>()
	const queries = map<TQuery, EntityBox<TEntity>>()

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

	function compute(query: Query<TEntity>) {
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
			for (const key in valuesOrComponent) {
				const component = key as TComponent
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

			if (value) {
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

	return {
		spawn,
		despawn,
		registerQuery(query: Query<TEntity>) {
			for (const component of [...query.with, ...query.without]) {
				const queries = getQueries(component)
				queries.add(query)
			}

			queries.set(query, createEntityBox())
			compute(query)
		},
		select<TSelect extends keyof TEntity>(query: Query<TEntity>) {
			const result = queries.get(query as AnyQuery) || createEntityBox()
			return result as unknown as EntityBox<SelectedValues<TEntity, TSelect>>
		},
		reset,
		entities,
		update,
		remove,
	}
}

type EntityBox<TEntity> = {
	byId: Map<string, TEntity>
	byRef: Map<TEntity, string>
	getId: (entity: TEntity) => string | undefined
	add: (id: string, entity: TEntity) => void
	remove: (idOrEntity: string | TEntity) => void
	getById: (id: string) => TEntity | undefined
	first: () => TEntity | undefined
	has: (idOrEntity: string | TEntity) => boolean
	clear: () => void
	size: () => number
	[Symbol.iterator]: () => IterableIterator<TEntity>
}

export function createEntityBox<TEntity>(): EntityBox<TEntity> {
	const byPosition: Array<TEntity> = []
	const byRef = map<TEntity, string>()
	const byId = map<string, TEntity>()

	function add(id: string, entity: TEntity) {
		byRef.set(entity, id)
		byId.set(id, entity)
		byPosition.push(entity)
	}

	function removePair(id: string, entity: TEntity) {
		byRef.delete(entity)
		byId.delete(id)
		byPosition.splice(byPosition.indexOf(entity), 1)
	}

	function remove(idOrEntity: string | TEntity) {
		if (typeof idOrEntity === 'string') {
			const entity = byId.get(idOrEntity)
			if (entity) {
				removePair(idOrEntity, entity)
			}
		}
		else {
			const id = byRef.get(idOrEntity)
			if (id) {
				removePair(id, idOrEntity)
			}
		}
	}

	function getById(id: string) {
		return byId.get(id)
	}

	function has(idOrEntity: string | TEntity) {
		if (typeof idOrEntity === 'string') {
			return byId.has(idOrEntity)
		}

		return byRef.has(idOrEntity)
	}

	function getId(entity: TEntity) {
		return byRef.get(entity)
	}

	function clear() {
		byRef.clear()
		byId.clear()
		byPosition.length = 0
	}

	return {
		byId,
		byRef,
		add,
		remove,
		getById,
		has,
		getId,
		clear,
		[Symbol.iterator]: () => {
			return byId.values()
		},
		first() {
			return byPosition[0]
		},
		size() {
			return byId.size
		},
	}
}

function match<TEntity extends Entity>(entity: TEntity, query: Query<TEntity>) {
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

	return !where || where(entity)
}
