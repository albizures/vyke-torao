import type { InferEntityWith } from '../ecs/entity'
import { createTransform2D, type Transform2D, type Transform2DEntity } from '../components'
import { defineComponent, defineQuery, type Query } from '../ecs'

export const Camera2D = defineComponent('camera2D', (_args: true) => true)

export type Camera2DEntity = InferEntityWith<typeof Camera2D> & Transform2DEntity

export const camera2DQuery: Query<Camera2DEntity> = defineQuery({
	id: 'camera-2d',
	with: ['camera2D', 'transform2D'],
})

export function createCamera2d(transform2D: Partial<Transform2D> = {}) {
	return {
		camera2D: true,
		transform2D: createTransform2D(transform2D),
	}
}
