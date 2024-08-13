import { createComponent } from '../ecs'
import type { Vec2d } from '../vec'

export const Velocity = createComponent<Vec2d>({
	label: 'velocity',
})
