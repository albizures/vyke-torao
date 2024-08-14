import { createSystem } from '../ecs'
import { withVelocityAndTransform } from '../queries'

export const velocityAndTransformSystem = createSystem({
	id: 'velocity-and-position',
	queries: {
		velocityAndTransform: withVelocityAndTransform,
	},
	update(args) {
		const { entities } = args
		const { velocityAndTransform } = entities

		for (const entity of velocityAndTransform) {
			const { transform, velocity } = entity.values
			const { position } = transform
			position.x += velocity.x
			position.y += velocity.y
		}
	},
})
