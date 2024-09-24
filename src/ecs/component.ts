import type { Entity } from './entity'
import { type AnyQuery, getValuesFrom, type Query, type QueryParams, updateListeners } from './query'

export type AnyComponent = Component<any, any>
export type Instance = Record<string, any>

export type Component<TInstance extends Instance, TArgs> = {
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

export function getComponent<TInstance extends Instance, TArgs>(entity: Entity, component: Component<TInstance, TArgs>): TInstance | undefined {
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
