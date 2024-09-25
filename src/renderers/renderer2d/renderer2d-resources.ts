import { createResource, type Resource } from '../../ecs'

type CanvasBufferValue = {
	context: CanvasRenderingContext2D
	buffer: CanvasRenderingContext2D
}

export const CanvasBufferRes: Resource<CanvasBufferValue> = createResource<CanvasBufferValue>({
	id: 'canvas-buffer',
	value: {
		get context(): CanvasRenderingContext2D {
			throw new Error('Trying to access invalid canvas buffer context')
		},
		get buffer(): CanvasRenderingContext2D {
			throw new Error('Trying to access invalid canvas buffer')
		},
	},
})
