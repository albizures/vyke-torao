import { createComponent } from '../ecs'
import type { Vec2D } from '../vec'

export const Velocity = createComponent<Vec2D>({
	id: 'velocity',
})
