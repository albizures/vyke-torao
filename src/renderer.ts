import { rootSola } from './sola'
import type { Canvas } from './canvas'
import type { System } from './ecs'

export type Renderer = {
	systems: Set<System>
	setup: (canvas: Canvas) => void
}
