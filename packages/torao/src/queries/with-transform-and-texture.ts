import { Texture, Transform } from '../components'
import { createQuery } from '../ecs'

export const withTransformAndTexture = createQuery({
	id: 'with-transform-and-texture',
	params: {
		transform: Transform,
		texture: Texture,
	},
})
