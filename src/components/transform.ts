import { type Component, createComponent } from '../ecs'
import { type Vec2D, vec2D } from '../vec'

type TransformData = {
	position: Vec2D
	/**
	 * Rotation in radians.
	 */
	angle: number
	scale: Vec2D
}

export const Transform: Component<TransformData, Partial<TransformData>> = createComponent<TransformData, Partial<TransformData>>({
	id: 'transform',
	create(args: Partial<TransformData>) {
		const { position = vec2D(0, 0), angle = 0, scale = vec2D(1, 1) } = args
		return {
			position,
			angle,
			scale,
		}
	},
})
