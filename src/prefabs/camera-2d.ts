import type { Component, InferEntity } from '../ecs/entity'
import { createTransform2D, type Transform2D, type Transform2DEntity } from '../components'
import { defineComponent, defineQuery, type Query } from '../ecs'

export const Camera2D: Component<'camera2D', true, true> = defineComponent('camera2D', (_args: true) => true as const)

export type Camera2DEntity = InferEntity<typeof Camera2D> & Transform2DEntity

export const camera2DQuery: Query<Camera2DEntity> = defineQuery({
	id: 'camera-2d',
	with: ['camera2D', 'transform2D'],
})

export function createCamera2d(transform2D: Partial<Transform2D> = {}): Required<Camera2DEntity> {
	return {
		camera2D: true as const,
		transform2D: createTransform2D(transform2D),
	}
}
