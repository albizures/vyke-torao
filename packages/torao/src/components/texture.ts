import type { AnyTexture } from '../texture'
import { createComponent } from '../ecs'

export const Texture = createComponent<AnyTexture>({
	label: 'texture',
})
