import { createComponent } from '../ecs'
import { type Vec2d, vec2 } from '../vec'

type TransformData = {
	position: Vec2d
	/**
	 * Rotation in radians.
	 */
	angle: number
	scale: Vec2d
}

export const Transform = createComponent<TransformData, Partial<TransformData>>({
	id: 'transform',
	create(args: Partial<TransformData>) {
		const { position = vec2(0, 0), angle = 0, scale = vec2(1, 1) } = args
		return {
			position,
			angle,
			scale,
		}
	},
})
