import type { LoopValues } from '../loop'
import { createResource } from '../ecs'

export const Loop = createResource<LoopValues>({
	id: 'loop',
	value: undefined as unknown as LoopValues,
})
