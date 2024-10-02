import type { Component } from '../ecs/entity'
import type { Vec2D } from '../vec'
import { defineComponent } from '../ecs'

export type Velocity2DComponent = Component<'velocity2D', Vec2D, Partial<Vec2D>>
export const Velocity2D: Velocity2DComponent = defineComponent('velocity2D', createVelocity2D)

function createVelocity2D(values: Partial<Vec2D>): Vec2D {
	const { x = 0, y = 0 } = values

	return { x, y }
}
