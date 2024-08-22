import type { Renderer } from './renderer'
import { CanvasBuffer } from './resources'
import { SystemType, createSystem } from './ecs'
import { withTransformAndTexture } from './queries'
import { AssetStatus, AssetType } from './assets'
import { camera2DQuery } from './prefabs'
import { Canvas } from './resources/canvas'
import type { Vec2D } from './vec'

const renderer2dSystem = createSystem({
	id: 'velocity-and-position',
	type: SystemType.Render,
	queries: {
		entitiesToRender: withTransformAndTexture.required(),
		camera2d: camera2DQuery.required().first(),
	},
	fn(args) {
		const { entities } = args
		const { entitiesToRender, camera2d } = entities

		const { buffer, context } = CanvasBuffer.mutable()

		buffer.clearRect(0, 0, context.canvas.width, context.canvas.height)
		buffer.save()
		if (camera2d) {
			const { transform } = camera2d.values
			const { position, scale, angle } = transform

			buffer.translate(position.x, position.y)
			buffer.rotate(angle)
			buffer.scale(scale.x, scale.y)
		}

		for (const entity of entitiesToRender) {
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

const renderer2dSetupSystem = createSystem({
	id: 'renderer-2d-setup',
	type: SystemType.Setup,
	fn() {
		const canvas = Canvas.value
		const { size, element } = canvas

		const context = element.getContext('2d')!
		const buffer = document.createElement('canvas').getContext('2d')!

		function setSize(size: Vec2D) {
			context.canvas.width = size.x
			context.canvas.height = size.y
		}

		canvas.onResize(setSize)

		setSize(size)

		CanvasBuffer.set({ buffer, context })
	},
})

export const renderer2d = [
	renderer2dSetupSystem,
	renderer2dSystem,
]
