import type { Component, InferEntity } from '../ecs/entity'
import type { Vec2D } from '../vec'
import { defineComponent } from '../ecs'

export const Velocity2D: Component<'velocity2D', Vec2D, Partial<Vec2D>> = defineComponent('velocity2D', createVelocity2D)
export type Velocity2DEntity = InferEntity<typeof Velocity2D>

function createVelocity2D(values: Partial<Vec2D>): Vec2D {
	const { x = 0, y = 0 } = values

	return { x, y }
}
