import type { Vec2D } from '../vec'
import { createComponent } from '../ecs'

export const Velocity = createComponent<Vec2D>({
	id: 'velocity',
})
