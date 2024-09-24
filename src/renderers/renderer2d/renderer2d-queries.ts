import { Transform } from '../../components'
import { createQuery, type Query } from '../../ecs'
import { Path2DTexture, Texture } from './renderer2d-components'

export const render2dEntities: Query<{
	transform: typeof Transform
	texture: typeof Texture
}> = createQuery({
	id: 'with-transform-and-texture',
	params: {
		transform: Transform,
		texture: Texture,
	},
	filters: [
		{ component: Path2DTexture, type: 'without' },
	],
})

export const render2dPath2dEntities: Query<{
	transform: typeof Transform
	texture2d: typeof Path2DTexture
	texture: typeof Texture
}> = createQuery({
	id: 'with-transform-and-path2d-texture',
	params: {
		transform: Transform,
		texture2d: Path2DTexture,
		texture: Texture,
	},
})
