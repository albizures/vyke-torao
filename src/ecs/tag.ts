import { type Component, createComponent } from './component'

export type Tag = Record<string, unknown>

export function createComponentTag(id: string): Component<Tag, Tag> {
	return createComponent({
		id,
		create: () => ({}),
	})
}
