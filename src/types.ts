import type { Class } from 'type-fest'

export function is<TValue>(value: unknown, type: Class<TValue>): value is TValue {
	return value instanceof type
}

export function set<TItem>(values?: Iterable<TItem>): Set<TItem> {
	return new Set<TItem>(values)
}

export function map<TKeys, TValues>(entries?: Array<[TKeys, TValues]>): Map<TKeys, TValues> {
	return new Map<TKeys, TValues>(entries)
}

export function noop() {}

/**
 * Useful for creating optional props.
 */
export type OptionalProps<TValue> = [TValue] extends [never] ? [] : [props: TValue]

export function deferredPromise<TValue>() {
	let resolve: (value: TValue) => void
	let reject: (error: unknown) => void
	const promise = new Promise<TValue>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve: resolve!, reject: reject! }
}
