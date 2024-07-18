import type { ReadonlyDeep } from 'type-fest'

/**
 * A resource is a value that can be shared between systems.
 */
export type Resource<TValue> = {
	label: string
	readonly value: ReadonlyDeep<TValue>
	mutable: () => TValue
	set: (value: TValue) => void
}

export type ResourceArgs<TValue> = {
	label: string
	value: TValue
}

/**
 * Creates a resource that can be shared between systems.
 */
export function createResource<TValue>(args: ResourceArgs<TValue>): Resource<TValue> {
	const { label, value } = args

	let currentValue = value

	return {
		label,
		get value() {
			return currentValue as ReadonlyDeep<TValue>
		},
		mutable() {
			return value
		},
		set(update) {
			currentValue = update
		},
	}
}