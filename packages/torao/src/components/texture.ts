import type { AnyTexture } from '../texture'
import { createComponent } from '../ecs'

export const textureComp = createComponent<AnyTexture>({
	label: 'texture',
})
