import { createSystem, type System, SystemType } from '../ecs'
import { withVelocityAndTransform } from '../queries'
import { LoopRes } from '../resources'

export const velocityAndTransformSystem: System = createSystem({
	id: 'velocity-and-position',
	queries: {
		velocityAndTransform: withVelocityAndTransform,
	},
	type: SystemType.Update,
	fn(args) {
		const { entities } = args
		const { velocityAndTransform } = entities
		const { deltaTime } = LoopRes.value

		for (const entity of velocityAndTransform) {
			const { transform, velocity } = entity.values
			const { position } = transform
			position.x += velocity.x * deltaTime
			position.y += velocity.y * deltaTime
		}
	},
})
