import { addComponent, type AnyComponent, type Instance } from './component'

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
