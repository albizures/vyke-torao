import { createComponent } from './component'
import type { Entity } from './entity'

export function createComponentTag(id: string) {
	const baseComponent = createComponent({
		id,
		create: () => ({
			tag: true,
		}),
	})

	return {
		...baseComponent,
		create() {
			return baseComponent.create({ tag: true })
		},
		entryFrom() {
			return baseComponent.entryFrom({ tag: true })
		},
		addTo(entity: Entity) {
			return baseComponent.addTo(entity, { tag: true })
		},
	}
}
