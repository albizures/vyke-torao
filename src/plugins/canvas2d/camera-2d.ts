import type { Query } from '../../ecs'
import type { Component, InferEntity } from '../../ecs/entity'
import type { Transform2DComponent } from './transform2d'
import { defineComponent, defineQuery } from '../../ecs'
import { Transform2D } from './transform2d'

export type Camera2DComponent = Component<'camera2D', true, true>
export const Camera2D: Camera2DComponent = defineComponent('camera2D', (_args: true) => true as const)

type Camera2DCreator = & Camera2DComponent & Transform2DComponent
const camera2dEntity: Camera2DCreator = {
	...Camera2D,
	...Transform2D,
}

type Camera2DEntity = InferEntity<Camera2DCreator>

export const camera2DQuery: Query<[typeof Camera2D, typeof Transform2D]> = defineQuery({
	id: 'camera-2d',
	with: [Camera2D, Transform2D],
})

export function createCamera2d(transform2D: Partial<Transform2D> = {}): Required<Camera2DEntity> {
	return {
		camera2D: true as const,
		transform2D: camera2dEntity.transform2D(transform2D),
	}
}
