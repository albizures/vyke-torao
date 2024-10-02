import { map } from '../types'

export type RefBox<TRef> = {
	byId: Map<string, TRef>
	byRef: Map<TRef, string>
	getId: (ref: TRef) => string | undefined
	add: (id: string, ref: TRef) => void
	remove: (refOrId: string | TRef) => void
	getById: (id: string) => TRef | undefined
	first: () => TRef | undefined
	has: (refOrId: string | TRef) => boolean
	clear: () => void
	size: () => number
	[Symbol.iterator]: () => IterableIterator<TRef>
}

export function createRefBox<TRef>(): RefBox<TRef> {
	const byPosition: Array<TRef> = []
	const byRef = map<TRef, string>()
	const byId = map<string, TRef>()

	function add(id: string, ref: TRef) {
		byRef.set(ref, id)
		byId.set(id, ref)
		byPosition.push(ref)
	}

	function removePair(id: string, ref: TRef) {
		byRef.delete(ref)
		byId.delete(id)
		byPosition.splice(byPosition.indexOf(ref), 1)
	}

	function remove(refOrId: string | TRef) {
		if (typeof refOrId === 'string') {
			const ref = byId.get(refOrId)
			if (ref) {
				removePair(refOrId, ref)
			}
		}
		else {
			const id = byRef.get(refOrId)
			if (id) {
				removePair(id, refOrId)
			}
		}
	}

	function getById(id: string) {
		return byId.get(id)
	}

	function has(refOrId: string | TRef) {
		if (typeof refOrId === 'string') {
			return byId.has(refOrId)
		}

		return byRef.has(refOrId)
	}

	function getId(ref: TRef) {
		return byRef.get(ref)
	}

	function clear() {
		byRef.clear()
		byId.clear()
		byPosition.length = 0
	}

	return {
		byId,
		byRef,
		add,
		remove,
		getById,
		has,
		getId,
		clear,
		[Symbol.iterator]: () => {
			return byId.values()
		},
		first() {
			return byPosition[0]
		},
		size() {
			return byId.size
		},
	}
}
