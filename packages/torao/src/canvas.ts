import { canvasRect } from './resources'
import type { Vec2d } from './vec'
import { vec2 } from './vec'

type ResizeListener = (size: Vec2d) => void

export type Canvas = {
	onResize: (listener: ResizeListener) => () => void
	element: HTMLCanvasElement
	readonly size: Vec2d
}

type CanvasArgs = {
	element: HTMLCanvasElement
} & ({
	resizeMode: 'fill'
} | {
	resizeMode: 'static'
	size: Vec2d
})

export type ResizeMode = CanvasArgs['resizeMode']

export function createCanvas(args: CanvasArgs): Canvas {
	const { element, resizeMode } = args
	const resizeListeners = new Set<ResizeListener>()

	function resize(width: number, height: number) {
		element.width = width
		element.height = height

		const rect = element.getBoundingClientRect()
		const size = vec2(rect.width, rect.height)

		canvasRect.set({
			size,
			position: vec2(rect.left, rect.top),
			halfSize: vec2.divideScalar(size, 2),
		})

		resizeListeners.forEach((listener) => listener(size))
	}

	function onResize(listener: ResizeListener) {
		resizeListeners.add(listener)
		return () => resizeListeners.delete(listener)
	}

	if (resizeMode === 'static') {
		const { size } = args
		resize(size.x, size.y)
	}

	if (resizeMode === 'fill') {
		resize(window.innerWidth, window.innerHeight)
		window.addEventListener('resize', () => {
			resize(window.innerWidth, window.innerHeight)
		})
	}

	return {
		onResize,
		element,
		get size() {
			return canvasRect.value.size
		},
	}
}
