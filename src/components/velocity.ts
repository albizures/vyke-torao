import type { InferEntityWith } from '../ecs/entity'
import type { Vec2D } from '../vec'
import { defineComponent } from '../ecs'

export const Velocity2D = defineComponent('velocity2D', createVelocity2D)
export type Velocity2DEntity = InferEntityWith<typeof Velocity2D>

function createVelocity2D(values: Partial<Vec2D>): Vec2D {
	const { x = 0, y = 0 } = values

	return { x, y }
}
