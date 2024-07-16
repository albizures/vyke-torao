import type { AnyComponent, ComponentInstance, InferComponentInstance } from './component'
import type { Disposable } from './disposable'

// import { rootSola } from './sola'
// const sola = rootSola.withTag('entities')

export type Entity = Disposable & {
	label: string
	components: Map<AnyComponent, ComponentInstance>
	getComponent: <TComponent extends AnyComponent>(component: TComponent) => InferComponentInstance<TComponent> | undefined
}

export type EntityArgs = {
	label: string
	components: Array<[AnyComponent, ComponentInstance]>
}

export function createEntity(args: EntityArgs): Entity {
	const { label, components: componentEntries } = args
	const components = new Map(componentEntries)

	return {
		components,
		label,
		getComponent<TComponent extends AnyComponent>(component: TComponent): InferComponentInstance<TComponent> | undefined {
			const instance = components.get(component)

			return (component.is(instance) ? instance : undefined) as InferComponentInstance<TComponent> | undefined
		},
	}
}
