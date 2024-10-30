type LoaderFn<TValue> =
	| (() => Promise<TValue>)
	| (() => TValue)

export class Loader<TValue> {
	cache?: TValue
	listeners: Array<(value: TValue) => void> = []
	constructor(public fn: LoaderFn<TValue>) {}

	async load(): Promise<TValue> {
		if (this.cache) {
			return this.cache
		}

		const value = await this.fn()
		this.cache = value

		for (const listener of this.listeners) {
			listener(value)
		}

		this.listeners = []

		return value
	}

	onLoad(listener: (value: TValue) => void) {
		if (this.cache) {
			listener(this.cache)
		}
		else {
			this.listeners.push(listener)
		}
	}
}
