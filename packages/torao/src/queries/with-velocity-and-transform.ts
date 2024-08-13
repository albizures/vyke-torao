import { Transform, Velocity } from '../components'
import { createQuery } from '../ecs'

export const withVelocityAndTransform = createQuery({
	label: 'with-velocity-and-position',
	params: {
		velocity: Velocity,
		transform: Transform,
	},
})
