import type { InferEntity, Query } from '../../ecs'
import type { Transform2d } from './transform2d'
import { defineEntity, defineQuery, identity } from '../../ecs'
import { Transform2dEntity } from './transform2d'

export const Camera2dEntity = defineEntity({
	camera2d: identity<true>(),
	...Transform2dEntity,
})

const { transform2d, camera2d } = Camera2dEntity

export const camera2DQuery: Query<[typeof camera2d, typeof transform2d]> = defineQuery({
	id: 'camera-2d',
	with: [camera2d, transform2d],
})

type Camera2DEntity = InferEntity<typeof Camera2dEntity>

export function createCamera2d(transform2D: Partial<Transform2d> = {}): Required<Camera2DEntity> {
	return {
		camera2d: true as const,
		transform2d: transform2d(transform2D),
	}
}
