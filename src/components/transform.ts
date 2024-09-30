import { type Vec2D, vec2D } from '../vec'

export type Transform2D = {
	position: Vec2D
	/**
	 * Rotation in radians.
	 */
	angle: number
	scale: Vec2D
}

export type WithTransform2D = {
	transform2D?: Transform2D
}

export function createTransform2D(args: Partial<Transform2D>): Transform2D {
	const { position = vec2D(0, 0), angle = 0, scale = vec2D(1, 1) } = args
	return {
		position,
		angle,
		scale,
	}
}
