import type { Transform2DEntity, Velocity2DEntity } from '../components'
import { defineQuery, type Query } from '../ecs/query'

export const withVelocity2DAndTransform2D: Query<Required<Transform2DEntity & Velocity2DEntity>> = defineQuery({
	id: 'with-velocity-and-position',
	with: ['transform2D', 'velocity2D'],
})
