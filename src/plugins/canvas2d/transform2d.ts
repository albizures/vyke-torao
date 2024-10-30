import type { Component } from '../../ecs/entity'
import { defineComponent } from '../../ecs'
import { type Vec2D, vec2D } from '../../vec'

export type Transform2D = {
	position: Vec2D
	/**
	 * Rotation in radians.
	 */
	angle: number
	scale: Vec2D
}

export type Transform2DComponent = Component<'transform2D', Transform2D, Partial<Transform2D>>
export const Transform2D: Transform2DComponent = defineComponent('transform2D', createTransform2D)

function createTransform2D(args: Partial<Transform2D>): Transform2D {
	const { position = vec2D(0, 0), angle = 0, scale = vec2D(1, 1) } = args
	return {
		position,
		angle,
		scale,
	}
}
