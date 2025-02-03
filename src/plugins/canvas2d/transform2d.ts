import type { InferEntityDefinition } from '../../ecs/entity'
import type { Vec2d } from '../../vec'
import { defineEntity } from '../../ecs'
import { vec2d } from '../../vec'

export type Transform2d = {
	position: Vec2d
	/**
	 * Rotation in radians.
	 */
	angle: number
	scale: Vec2d
}

export type Transform2dEntity = InferEntityDefinition<{
	transform2d: (args: Partial<Transform2d>) => Transform2d
}>

export const Transform2dEntity: Transform2dEntity = defineEntity({
	transform2d: createTransform2d,
})

function createTransform2d(args: Partial<Transform2d>): Transform2d {
	const { position = vec2d(0, 0), angle = 0, scale = vec2d(1, 1) } = args
	return {
		position,
		angle,
		scale,
	}
}
