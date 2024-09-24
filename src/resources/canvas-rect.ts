import { createResource, type Resource } from '../ecs'
import { vec2D, type Vec2D } from '../vec'

type CanvasRect = {
	size: Vec2D
	position: Vec2D
	halfSize: Vec2D
}

export const canvasRect: Resource<CanvasRect> = createResource({
	id: 'canvas-rect',
	value: {
		size: vec2D(0, 0),
		position: vec2D(0, 0),
		halfSize: vec2D(0, 0),
	},
})
