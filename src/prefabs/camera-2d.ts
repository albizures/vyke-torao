import { createTransform2D, type MaybeWithTransform2D, type Transform2D } from '../components'
import { createQuery, type Query } from '../ecs'

export type MaybeWithCamera2D = MaybeWithTransform2D & {
	camera2D?: true
}

export const camera2DQuery: Query<MaybeWithCamera2D> = createQuery<MaybeWithCamera2D>({
	id: 'camera-2d',
	with: ['camera2D', 'transform2D'],
})

export function createCamera2d(transform2D: Partial<Transform2D> = {}): MaybeWithCamera2D {
	return {
		camera2D: true,
		transform2D: createTransform2D(transform2D),
	}
}
