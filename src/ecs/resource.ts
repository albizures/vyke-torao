import type { ReadonlyDeep } from 'type-fest'

/**
 * A resource is a value that can be shared between systems.
 */
export type Resource<TValue> = {
	id: string
	readonly value: ReadonlyDeep<TValue>
	mutable: () => TValue
	set: (value: TValue) => void
}

export type ResourceArgs<TValue> = {
	id: string
	value: TValue
}

/**
 * Creates a resource that can be shared between systems.
 */
export function createResource<TValue>(args: ResourceArgs<TValue>): Resource<TValue> {
	const { id, value } = args

	let currentValue = value

	return {
		id,
		get value() {
			return currentValue as ReadonlyDeep<TValue>
		},
		mutable() {
			return currentValue
		},
		set(update) {
			currentValue = update
		},
	}
}
