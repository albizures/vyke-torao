import type { Vec2d } from '../vec'
import { defineEntity } from '../ecs'

export const Velocity2dEntity = defineEntity({
	velocity2d: createVelocity2d,
})

function createVelocity2d(values: Partial<Vec2d>): Vec2d {
	const { x = 0, y = 0 } = values

	return { x, y }
}
