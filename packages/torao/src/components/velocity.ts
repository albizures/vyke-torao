import { createComponent } from '../ecs'
import type { Vec2d } from '../vec'

export const velocityComp = createComponent<Vec2d>({
	label: 'velocity',
})
