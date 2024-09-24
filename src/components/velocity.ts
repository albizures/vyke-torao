import type { Vec2D } from '../vec'
import { type Component, createComponent } from '../ecs'

export const Velocity: Component<Vec2D, Vec2D> = createComponent<Vec2D>({
	id: 'velocity',
})
