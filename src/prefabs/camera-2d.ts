import { createTransform2D, type Transform2D, type WithTransform2D } from '../components'
import { defineQuery, type Query } from '../ecs'

export type WithCamera2D = WithTransform2D & {
	camera2D?: true
}

export const camera2DQuery: Query<Required<WithCamera2D>> = defineQuery<Required<WithCamera2D>>({
	id: 'camera-2d',
	with: ['camera2D', 'transform2D'],
})

export function createCamera2d(transform2D: Partial<Transform2D> = {}): WithCamera2D {
	return {
		camera2D: true,
		transform2D: createTransform2D(transform2D),
	}
}
