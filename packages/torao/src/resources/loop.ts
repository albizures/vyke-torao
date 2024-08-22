import { createResource } from '../ecs'
import type { LoopValues } from '../loop'

export const Loop = createResource<LoopValues>({
	id: 'loop',
	value: undefined as unknown as LoopValues,
})
