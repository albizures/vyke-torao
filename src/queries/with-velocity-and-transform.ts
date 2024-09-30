import type { WithTransform2D, WithVelocity2D } from '../components'
import { defineQuery, type Query } from '../ecs/query'

export const withVelocity2DAndTransform2D: Query<Required<WithTransform2D & WithVelocity2D>> = defineQuery({
	id: 'with-velocity-and-position',
	with: ['transform2D', 'velocity2D'],
})
