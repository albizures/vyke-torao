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
