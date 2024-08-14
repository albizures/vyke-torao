import { createComponent } from './component'
import type { Entity } from './entity'

export function createComponentTag(label: string) {
	const baseComponent = createComponent({
		label,
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
