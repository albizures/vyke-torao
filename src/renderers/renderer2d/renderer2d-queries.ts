import { Transform } from '../../components'
import { createQuery, Not } from '../../ecs'
import { Path2DTexture, Texture } from './renderer2d-components'

export const render2dEntities = createQuery({
	id: 'with-transform-and-texture',
	params: {
		transform: Transform,
		texture: Texture,
		texture2d: Not(Path2DTexture),
	},
})

export const render2dPath2dEntities = createQuery({
	id: 'with-transform-and-path2d-texture',
	params: {
		transform: Transform,
		texture2d: Path2DTexture,
		texture: Texture,
	},
})
