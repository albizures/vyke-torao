import type { AnyAtlas } from '../../texture'
import type { Vec2D } from '../../vec'
import { AssetStatus, CanvasAsset, ImageAsset, loadAsset, Path2DAsset } from '../../assets'
import { createSystem, first, required, type System, SystemType } from '../../ecs'
import { camera2DQuery } from '../../prefabs'
import { CanvasRes } from '../../resources'
import { is } from '../../types'
import { render2dEntities, render2dPath2dEntities } from './renderer2d-queries'
import { CanvasBufferRes } from './renderer2d-resources'

const render2dBeforeFrameSystem = createSystem({
	id: 'renderer-2d-before-frame',
	type: SystemType.BeforeFrame,
	queries: {
		camera2d: first(required(camera2DQuery)),
	},
	fn(args) {
		const { entities } = args
		const { camera2d } = entities
		const { buffer, context } = CanvasBufferRes.mutable()

		buffer.clearRect(0, 0, context.canvas.width, context.canvas.height)

		const { transform } = camera2d.values
		const { position, scale, angle } = transform

		buffer.save()
		buffer.translate(position.x, position.y)
		buffer.rotate(angle)
		buffer.scale(scale.x, scale.y)
	},
})

const render2dAfterFrameSystem = createSystem({
	id: 'renderer-2d-after-frame',
	type: SystemType.AfterFrame,
	fn() {
		const { buffer, context } = CanvasBufferRes.mutable()

		buffer.restore()
		context.clearRect(0, 0, context.canvas.width, context.canvas.height)
		context.drawImage(buffer.canvas, 0, 0)
	},
})

const renderer2dSystem = createSystem({
	id: 'renderer-2d',
	type: SystemType.Render,
	queries: {
		entitiesToRender: render2dEntities,
	},
	fn(args) {
		const { entities } = args
		const { entitiesToRender } = entities

		const { buffer } = CanvasBufferRes.mutable()

		for (const entity of entitiesToRender) {
			const { transform, texture } = entity.values
			const { asset, atlas } = texture
			const { position, scale, angle } = transform

			if (is(asset, ImageAsset) || is(asset, CanvasAsset)) {
				const image = getImage(asset, atlas)
				buffer.save()
				buffer.rotate(angle)

				buffer.drawImage(image,
					atlas.region.x, atlas.region.y,
					atlas.region.width, atlas.region.height,
					position.x, position.y,
					atlas.region.width * scale.x, atlas.region.height * scale.y,
				)
				buffer.restore()
			}
		}
	},
})

function getImage(asset: ImageAsset | CanvasAsset, atlas: AnyAtlas): HTMLCanvasElement | HTMLImageElement {
	if (asset.value) {
		return asset.value
	}

	loadAsset(asset)

	return asset.fallback(atlas).canvas
}

const render2dPath2dSystem = createSystem({
	id: 'renderer-2d-path2d',
	type: SystemType.Render,
	queries: {
		entitiesToRender: render2dPath2dEntities,
	},
	fn(args) {
		const { entities } = args
		const { entitiesToRender } = entities
		const { buffer } = CanvasBufferRes.mutable()

		for (const entity of entitiesToRender) {
			const { transform, texture, texture2d } = entity.values

			const { asset } = texture
			const { position, scale, angle } = transform

			if (!is(asset, Path2DAsset)) {
				throw new TypeError('Path2D asset expected')
			}
			if (asset.status === AssetStatus.Error || !asset.value) {
				throw new Error('Path2D asset is in error state')
			}

			buffer.save()
			buffer.translate(position.x, position.y)
			buffer.rotate(angle)
			buffer.scale(scale.x, scale.y)

			texture2d.paint(buffer, asset.value)
			buffer.restore()
		}
	},
})

const renderer2dEnterSceneSystem = createSystem({
	id: 'renderer-2d-setup',
	type: SystemType.EnterScene,
	fn() {
		const canvas = CanvasRes.value
		const { size, element } = canvas

		const context = element.getContext('2d')!
		const buffer = document.createElement('canvas').getContext('2d')!

		function setSize(size: Vec2D) {
			context.canvas.width = size.x
			context.canvas.height = size.y
			buffer.canvas.width = size.x
			buffer.canvas.height = size.y
		}

		canvas.onResize(setSize)

		setSize(size)

		CanvasBufferRes.set({ buffer, context })
	},
})

export const renderer2d: { systems: Array<System> } = {
	systems: [
		renderer2dEnterSceneSystem,
		renderer2dSystem,
		render2dBeforeFrameSystem,
		render2dPath2dSystem,
		render2dAfterFrameSystem,
	],
}

export * from './renderer2d-components'
export * from './renderer2d-queries'
export * from './renderer2d-resources'
