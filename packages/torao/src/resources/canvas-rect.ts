import { createResource } from '../ecs'
import { vec2 } from '../vec'

export const canvasRect = createResource({
	id: 'canvas-rect',
	value: {
		size: vec2(0, 0),
		position: vec2(0, 0),
		halfSize: vec2(0, 0),
	},
})
