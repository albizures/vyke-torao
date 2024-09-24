import type { LoopValues } from '../loop'
import { createComponent, createEntity, createQuery, entryFrom, first, required } from '../ecs'
import { createPrefab } from '../prefab'

const Loop = createComponent<LoopValues>({
	id: 'loop',
})

export const LoopQuery = first(required(createQuery({
	id: 'loop-query',
	params: {
		loop: Loop,
	},
})))

export const LoopEntity = createPrefab({
	id: 'loop',
	create: (args: LoopValues) => {
		const entity = createEntity({
			id: 'loop',
			components: [
				entryFrom(Loop, args),
			],
		})

		return entity
	},
})
