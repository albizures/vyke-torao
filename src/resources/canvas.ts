import type { Canvas as CanvasValue } from '../engine/canvas'
import { createResource, type Resource } from '../ecs'

export const CanvasRes: Resource<CanvasValue> = createResource<CanvasValue>({
	id: 'canvas',
	value: undefined as unknown as CanvasValue,
})
