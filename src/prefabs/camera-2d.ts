import type { Vec2D } from '../vec'
import { Transform } from '../components'
import { type Component, createComponentTag, createEntity, createQuery, entryFrom, type Query, type Tag } from '../ecs'
import { createPrefab, type Prefab } from '../prefab'

type Camera2DArgs = {
	id: string
	position?: Vec2D
	scale?: Vec2D
	angle?: number
}

const Camera2D: Component<Tag, Tag> = createComponentTag('camera-2d')

export const camera2DQuery: Query<{
	transform: typeof Transform
	camera2D: typeof Camera2D
}> = createQuery({
	id: 'Camera 2D Query',
	params: {
		transform: Transform,
		camera2D: Camera2D,
	},
})

export const camera2D: Prefab<Camera2DArgs> = createPrefab({
	id: 'Camera 2D',
	create: (args: Camera2DArgs) => {
		const { id } = args
		const entity = createEntity({
			id,
			components: [
				entryFrom(Transform, args),
				entryFrom(Camera2D, {}),
			],
		})

		return entity
	},
})
