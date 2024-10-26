import type { LoopValues } from '../engine/loop'
import { createResource, type Resource } from '../ecs'

export const LoopRes: Resource<LoopValues> = createResource<LoopValues>({
	id: 'loop',
	value: undefined as unknown as LoopValues,
})
