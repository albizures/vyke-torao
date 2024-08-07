import { createComponent } from '../ecs'
import type { Vec2d } from '../vec'

export const positionComp = createComponent<Vec2d>({
	label: 'position',
})
