import type { AnyComponent, ComponentInstance, InferComponentInstance } from './component'
import { COMPONENTS } from './component'

export type Entity = {
	label: string
	[COMPONENTS]: Map<AnyComponent, ComponentInstance>
	getComponent: <TComponent extends AnyComponent>(component: TComponent) => InferComponentInstance<TComponent> | undefined
	addComponent: <TComponent extends AnyComponent>(component: TComponent, instance: InferComponentInstance<TComponent>) => void
	removeComponent: <TComponent extends AnyComponent>(component: TComponent) => void
	setComponent: <TComponent extends AnyComponent>(component: TComponent, instance: InferComponentInstance<TComponent>) => void
}

export type EntityArgs = {
	label: string
	components: Array<[AnyComponent, ComponentInstance]>
}

export function createEntity(args: EntityArgs): Entity {
	const { label, components: componentEntries } = args

	const entity: Entity = {
		label,
		[COMPONENTS]: new Map(componentEntries),
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
			component.setValue(entity, instance)
		},
	}

	return entity
}
