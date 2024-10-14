import type { InferEntity } from '../ecs'
import { Transform2D, type Transform2DComponent, Velocity2D, type Velocity2DComponent } from '../components'
import { defineQuery, type Query } from '../ecs/query'

export type EntityCreatorWithVelocityAndTransform = Transform2DComponent & Velocity2DComponent
export type EntityWithVelocityAndTransform = InferEntity<EntityCreatorWithVelocityAndTransform>

export const withVelocity2DAndTransform2D: Query<[typeof Transform2D, typeof Velocity2D]> = defineQuery({
	id: 'with-velocity-and-position',
	with: [Transform2D, Velocity2D],
})
