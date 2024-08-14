import { Transform } from '../components'
import { createComponentTag, createEntity, createQuery } from '../ecs'
import { createPrefab } from '../prefab'
import type { Vec2d } from '../vec'

type Camera2DArgs = {
	id: string
	position?: Vec2d
	scale?: Vec2d
	angle?: number
}

const Camera2D = createComponentTag('camera-2d')

export const camera2DQuery = createQuery({
	id: 'Camera 2D Query',
	params: {
		transform: Transform,
		camera2D: Camera2D,
	},
})

export const camera2D = createPrefab({
	id: 'Camera 2D',
	create: (args: Camera2DArgs) => {
		const { id, position, angle, scale } = args
		const entity = createEntity({
			id,
			components: [
				Transform.entryFrom({ position, angle, scale }),
				Camera2D.entryFrom(),
			],
		})

		return entity
	},
})
