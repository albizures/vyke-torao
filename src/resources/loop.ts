import type { LoopValues } from '../loop'
import { createResource, type Resource } from '../ecs'

export const Loop: Resource<LoopValues> = createResource<LoopValues>({
	id: 'loop',
	value: undefined as unknown as LoopValues,
})
