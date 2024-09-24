import { Transform, Velocity } from '../components'
import { createQuery, type Query } from '../ecs'

export const withVelocityAndTransform: Query<{
	velocity: typeof Velocity
	transform: typeof Transform
}> = createQuery({
	id: 'with-velocity-and-position',
	params: {
		velocity: Velocity,
		transform: Transform,
	},
})
