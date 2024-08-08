import { createComponent } from '../ecs'
import type { Vec2d } from '../vec'

export const Body = createComponent<Vec2d>({
	label: 'body',
})
