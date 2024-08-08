import { rootSola } from './sola'
import type { Entity } from './ecs/entity'
import type { Canvas } from './canvas'

const _sola = rootSola.withTag('renderer')

export type Renderer = {
	render: (entities: Set<Entity>) => void
	setup: (canvas: Canvas) => void
}
