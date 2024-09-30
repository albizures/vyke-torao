import type { WithTransform2D, WithVelocity2D } from '../components'
import { createQuery, type Query } from '../ecs'

export const withVelocity2DAndTransform2D: Query<Required<WithTransform2D & WithVelocity2D>> = createQuery({
	id: 'with-velocity-and-position',
	with: ['transform2D', 'velocity2D'],
})
