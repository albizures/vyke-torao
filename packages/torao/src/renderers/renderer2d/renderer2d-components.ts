import type { AnyTexture } from '../../texture'
import { createComponent } from '../../ecs'

export const Texture = createComponent<AnyTexture>({
	id: 'texture',
})

type Path2DTextureValue = {
	paint: (context: CanvasRenderingContext2D, path: Path2D) => void
}

export const Path2DTexture = createComponent<Path2DTextureValue>({
	id: 'path2d-texture',
})
