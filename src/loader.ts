import { rootSola } from './sola'

const sola = rootSola.withTag('loader')

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

export function loadImage(url: string): Loader<HTMLImageElement> {
	return new Loader(() => new Promise((resolve, reject) => {
		const image = document.createElement('img')

		image.onload = () => {
			sola.info(`Loaded image: ${url}`)
			resolve(image)
		}

		image.onerror = () => {
			sola.error(`Failed to load image: ${url}`)
			reject(new Error(`Failed to load image: ${url}`))
		}

		image.src = url
	}))
}

export function loadCanvasContext(canvas: HTMLCanvasElement): Loader<CanvasRenderingContext2D> {
	return new Loader(async () => {
		const context = canvas.getContext('2d')
		if (context) {
			return context
		}
		else {
			throw new Error('Failed to get 2d context')
		}
	})
}
