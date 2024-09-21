import { rootSola } from './sola'

const sola = rootSola.withTag('loader')

export type Loader<TValue> =
	| (() => Promise<TValue>)
	| (() => TValue)

export function loadImage(url: string): Loader<HTMLImageElement> {
	return () => new Promise((resolve, reject) => {
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
	})
}

export function loadCanvasContext(canvas: HTMLCanvasElement): Loader<CanvasRenderingContext2D> {
	return async () => {
		const context = canvas.getContext('2d')
		if (context) {
			return context
		}
		else {
			throw new Error('Failed to get 2d context')
		}
	}
}

export function loadPath2D(builder: (path: Path2D) => void): Loader<Path2D> {
	return () => {
		const path = new Path2D()
		builder(path)
		return path
	}
}
