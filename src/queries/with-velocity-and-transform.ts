import type { Transform2DComponent, Velocity2DComponent } from '../components'
import type { InferEntity } from '../ecs'
import { defineQuery, type Query } from '../ecs/query'

export type EntityCreatorWithVelocityAndTransform = Transform2DComponent & Velocity2DComponent
export type EntityWithVelocityAndTransform = InferEntity<EntityCreatorWithVelocityAndTransform>

export const withVelocity2DAndTransform2D: Query<EntityWithVelocityAndTransform> = defineQuery({
	id: 'with-velocity-and-position',
	with: ['transform2D', 'velocity2D'],
})
