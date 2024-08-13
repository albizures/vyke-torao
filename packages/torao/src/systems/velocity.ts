import { createSystem } from '../ecs'
import { withVelocityAndTransform } from '../queries'

export const velocityAndTransformSystem = createSystem({
	label: 'velocity-and-position',
	queries: [withVelocityAndTransform],
	update() {
		for (const entity of withVelocityAndTransform.get()) {
			const { transform, velocity } = entity.values
			const { position } = transform
			position.x += velocity.x
			position.y += velocity.y
		}
	},
})
