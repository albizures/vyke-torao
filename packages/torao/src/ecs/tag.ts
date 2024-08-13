import { createComponent } from './component'
import type { Entity } from './entity'

type ComponentIdArgs = {
	label: string

}

export function createComponentTag(args: ComponentIdArgs) {
	const baseComponent = createComponent({
		label: args.label,
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
