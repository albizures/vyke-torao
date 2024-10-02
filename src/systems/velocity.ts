import { createSystem, type System, SystemType } from '../ecs'
import { type EntityWithVelocityAndTransform, withVelocity2DAndTransform2D } from '../queries'
import { LoopRes } from '../resources'

export const velocityAndTransformSystem: System<EntityWithVelocityAndTransform> = createSystem({
	id: 'velocity-and-position',
	type: SystemType.Update,
	fn(args) {
		const { select } = args
		const { deltaTime } = LoopRes.value

		for (const entity of select(withVelocity2DAndTransform2D)) {
			const { transform2D, velocity2D } = entity
			const { position } = transform2D
			position.x += velocity2D.x * deltaTime
			position.y += velocity2D.y * deltaTime
		}
	},
})
