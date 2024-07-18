import { rootSola } from './sola'
import type { Entity } from './ecs/entity'

const _sola = rootSola.withTag('renderer')

export type Renderer = {
	render: (entities: Set<Entity>) => void
	setup: (canvas: HTMLCanvasElement) => void
}
