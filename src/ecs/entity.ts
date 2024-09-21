import type { AnyComponent, ComponentInstance, InferComponentInstance } from './component'
import { COMPONENTS } from './component'

export type Entity = {
	id: string
	[COMPONENTS]: Map<AnyComponent, ComponentInstance>
	getComponent: <TComponent extends AnyComponent>(component: TComponent) => InferComponentInstance<TComponent> | undefined
	addComponent: <TComponent extends AnyComponent>(component: TComponent, instance: InferComponentInstance<TComponent>) => void
	removeComponent: <TComponent extends AnyComponent>(component: TComponent) => void
	setComponent: <TComponent extends AnyComponent>(component: TComponent, instance: InferComponentInstance<TComponent>) => void
}

export type EntityArgs = {
	id: string
	components: Array<[AnyComponent, ComponentInstance]>
}

export function createEntity(args: EntityArgs): Entity {
	const { id, components: componentEntries } = args

	const entity: Entity = {
		id,
		[COMPONENTS]: new Map(),
		getComponent<TComponent extends AnyComponent>(component: TComponent) {
			return component.getFrom(entity) as InferComponentInstance<TComponent> | undefined
		},
		addComponent(component, instance) {
			component.addTo(entity, instance)
		},
		removeComponent(component) {
			component.removeFrom(entity)
		},
		setComponent(component, instance) {
			component.setIn(entity, instance)
		},
	}

	for (const [component, instance] of componentEntries) {
		component.addTo(entity, instance)
	}

	return entity
}