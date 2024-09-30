import type { MaybeWithTransform2D, MaybeWithVelocity2D } from '../components'
import { createQuery, type Query } from '../ecs'

export const withVelocity2DAndTransform2D: Query<MaybeWithTransform2D & MaybeWithVelocity2D> = createQuery({
	id: 'with-velocity-and-position',
	with: ['transform2D', 'velocity2D'],
})
