import type { Canvas as CanvasValue } from '../canvas'
import { createResource } from '../ecs'

export const Canvas = createResource<CanvasValue>({
	id: 'canvas',
	value: undefined as unknown as CanvasValue,
})
