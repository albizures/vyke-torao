import { createResource } from '../ecs'
import { vec2D } from '../vec'

export const canvasRect = createResource({
	id: 'canvas-rect',
	value: {
		size: vec2D(0, 0),
		position: vec2D(0, 0),
		halfSize: vec2D(0, 0),
	},
})
