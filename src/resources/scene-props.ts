import { createResource, type Resource } from '../ecs'

export const ScenePropsRes: Resource<any> = createResource({
	id: 'canvas-rect',
	value: undefined,
})
