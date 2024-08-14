import { createResource } from '../ecs'

export const CanvasBuffer = createResource({
	id: 'canvas-buffer',
	value: {
		context: null as unknown as CanvasRenderingContext2D,
		buffer: null as unknown as CanvasRenderingContext2D,
	},
})
