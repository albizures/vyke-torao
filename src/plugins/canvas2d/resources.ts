import type { Resource } from '../../ecs'
import type { Vec2D } from '../../vec'
import { createResource } from '../../ecs'

type HtmlCanvas = {
	canvas: HTMLCanvasElement
	onResize: (listener: (size: Vec2D) => void) => () => void
}

export const HtmlCanvasRes: Resource<HtmlCanvas | undefined> = createResource<HtmlCanvas | undefined>({
	id: 'canvas',
	value: undefined,
})

type CanvasRect = {
	size: Vec2D
	position: Vec2D
	halfSize: Vec2D
}

export const HtmlCanvasRectRes: Resource<CanvasRect | undefined> = createResource<CanvasRect | undefined>({
	id: 'canvas-rect',
	value: {
		size: { x: 0, y: 0 },
		position: { x: 0, y: 0 },
		halfSize: { x: 0, y: 0 },
	},
})

type CanvasBufferValue = {
	context: CanvasRenderingContext2D
	buffer: CanvasRenderingContext2D
}

export const CanvasBufferRes: Resource<CanvasBufferValue> = createResource({
	id: 'canvas-buffer',
	value: {
		get context(): CanvasRenderingContext2D {
			throw new Error('Trying to access invalid canvas buffer context')
		},
		get buffer(): CanvasRenderingContext2D {
			throw new Error('Trying to access invalid canvas buffer')
		},
	},
})
