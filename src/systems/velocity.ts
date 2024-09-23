import { createSystem, SystemType } from '../ecs'
import { withVelocityAndTransform } from '../queries'
import { Loop } from '../resources'

export const velocityAndTransformSystem = createSystem({
	id: 'velocity-and-position',
	queries: {
		velocityAndTransform: withVelocityAndTransform,
	},
	type: SystemType.Update,
	fn(args) {
		const { entities } = args
		const { velocityAndTransform } = entities
		const { deltaTime } = Loop.value

		for (const entity of velocityAndTransform) {
			const { transform, velocity } = entity.values
			const { position } = transform
			position.x += velocity.x * deltaTime
			position.y += velocity.y * deltaTime
		}
	},
})
