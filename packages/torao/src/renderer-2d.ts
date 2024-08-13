import type { Renderer } from './renderer'
import type { Canvas } from './canvas'
import { CanvasBuffer } from './resources'
import { createSystem } from './ecs'
import { withTransformAndTexture } from './queries'
import { AssetStatus, AssetType } from './assets'
import { camera2DQuery } from './prefabs'

const renderer2dSystem = createSystem({
	label: 'velocity-and-position',
	queries: [withTransformAndTexture, camera2DQuery],
	update() {
		const { buffer, context } = CanvasBuffer.mutable()

		buffer.clearRect(0, 0, context.canvas.width, context.canvas.height)
		buffer.save()
		const camera2d = camera2DQuery.first()
		if (camera2d) {
			const { transform } = camera2d.values
			const { position, scale, angle } = transform

			buffer.translate(position.x, position.y)
			buffer.rotate(angle)
			buffer.scale(scale.x, scale.y)
		}

		for (const entity of withTransformAndTexture.get()) {
			const { transform, texture } = entity.values
			const { asset, atlas } = texture
			const { position, scale, angle: rotation } = transform
			if (asset.type === AssetType.Image || asset.type === AssetType.Canvas) {
				const image = asset.status === AssetStatus.Error
					? asset.fallback(atlas.region).canvas
					: asset.use()

				buffer.save()
				buffer.rotate(rotation)
				buffer.drawImage(image,
					atlas.region.x, atlas.region.y,
					atlas.region.width, atlas.region.height,
					position.x, position.y,
					atlas.region.width * scale.x, atlas.region.height * scale.y,
				)
				buffer.restore()
			}
		}

		buffer.restore()

		context.clearRect(0, 0, context.canvas.width, context.canvas.height)
		context.drawImage(buffer.canvas, 0, 0)
	},
})

export function createRenderer2d(): Renderer {
	let context: CanvasRenderingContext2D
	const buffer = document.createElement('canvas').getContext('2d')!

	return {
		systems: new Set([renderer2dSystem]),
		setup(canvas: Canvas) {
			const { size, element } = canvas

			context = element.getContext('2d')!

			canvas.onResize((size) => {
				buffer.canvas.width = size.x
				buffer.canvas.height = size.y
			})

			buffer.canvas.width = size.x
			buffer.canvas.height = size.y

			CanvasBuffer.set({ buffer, context })
		},
	}
}
