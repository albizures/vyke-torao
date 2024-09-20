import { createComponent, createEntity, createQuery } from '../ecs'
import type { LoopValues } from '../loop'
import { createPrefab } from '../prefab'

const Loop = createComponent<LoopValues>({
	id: 'loop',
})

export const LoopQuery = createQuery({
	id: 'loop-query',
	params: {
		loop: Loop,
	},
})
	.required()
	.first()

export const LoopEntity = createPrefab({
	id: 'loop',
	create: (args: LoopValues) => {
		const entity = createEntity({
			id: 'loop',
			components: [
				Loop.entryFrom(args),
			],
		})

		return entity
	},
})
