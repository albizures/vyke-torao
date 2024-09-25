import type { Texture as AnyTexture } from '../../texture'
import { type Component, createComponent } from '../../ecs'

export const Texture: Component<AnyTexture, AnyTexture> = createComponent<AnyTexture>({
	id: 'texture',
})

type Path2DTextureValue = {
	paint: (context: CanvasRenderingContext2D, path: Path2D) => void
}

export const Path2DTexture: Component<Path2DTextureValue, Path2DTextureValue> = createComponent<Path2DTextureValue>({
	id: 'path2d-texture',
})
