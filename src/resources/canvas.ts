import { createResource } from '../ecs'
import type { Canvas as CanvasValue } from '../canvas'

export const Canvas = createResource<CanvasValue>({
	id: 'canvas',
	value: undefined as unknown as CanvasValue,
})
