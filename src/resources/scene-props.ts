import type { Resource } from '../ecs'
import { createResource } from '../ecs'

export const ScenePropsRes: Resource<any> = createResource({
	id: 'canvas-rect',
	value: undefined,
})
