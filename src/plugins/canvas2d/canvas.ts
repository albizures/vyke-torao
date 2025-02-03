import type { Vec2d } from '../../vec'
import { assert } from '../../error'
import { vec2d } from '../../vec'
import { HtmlCanvasRectRes, HtmlCanvasRes } from './resources'

type ResizeListener = (size: Vec2d) => void

export type CanvasArgs = {
	element: HTMLElement
} & ({
	resizeMode: 'fill'
} | {
	resizeMode: 'static'
	size: Vec2d
})

export type ResizeMode = CanvasArgs['resizeMode']

export function createCanvas(args: CanvasArgs) {
	const { element, resizeMode } = args
	const resizeListeners = new Set<ResizeListener>()

	const root = (element instanceof HTMLCanvasElement ? element.parentElement : element)
	const canvas = element instanceof HTMLCanvasElement ? element : document.createElement('canvas')

	assert(root, 'Canvas element must have a parent')

	if (!root.contains(canvas)) {
		root.append(canvas)
	}

	function resize(width: number, height: number) {
		canvas.width = width
		canvas.height = height

		const rect = element.getBoundingClientRect()
		const size = vec2d(rect.width, rect.height)

		HtmlCanvasRectRes.set({
			size,
			position: vec2d(rect.left, rect.top),
			halfSize: vec2d.divideScalar(size, 2),
		})

		resizeListeners.forEach((listener) => listener(size))
	}

	if (resizeMode === 'static') {
		const { size } = args
		resize(size.x, size.y)
	}

	if (resizeMode === 'fill') {
		resize(root.clientWidth, root.clientHeight)
		window.addEventListener('resize', () => {
			resize(root.clientWidth, root.clientHeight)
		})
	}

	function onResize(listener: ResizeListener) {
		resizeListeners.add(listener)
		return () => resizeListeners.delete(listener)
	}

	HtmlCanvasRes.set({ canvas, onResize })
}
