import type { Vec2D } from '../vec'
import { loadAsset } from '../assets'
import { Transform } from '../components'
import { type Component,
	createComponent,
	createQuery,
	createResource,
	createSystem,
	first,
	type Query,
	required,
	type Resource,
	type System, SystemType,
} from '../ecs'
import { camera2DQuery } from '../prefabs'
import { CanvasRes } from '../resources'
import { type AnyAtlas, type Texture as AnyTexture, isTextureAssetType, type TextureAssets } from '../texture'
import { is } from '../types'

type CanvasBufferValue = {
	context: CanvasRenderingContext2D
	buffer: CanvasRenderingContext2D
}

export const CanvasBufferRes: Resource<CanvasBufferValue> = createResource<CanvasBufferValue>({
	id: 'canvas-buffer',
	value: {
		get context(): CanvasRenderingContext2D {
			throw new Error('Trying to access invalid canvas buffer context')
		},
		get buffer(): CanvasRenderingContext2D {
			throw new Error('Trying to access invalid canvas buffer')
		},
	},
})

export const Texture: Component<AnyTexture, AnyTexture> = createComponent<AnyTexture>({
	id: 'texture',
})

const render2dEntities: Query<{
	transform: typeof Transform
	texture: typeof Texture
}> = createQuery({
	id: 'with-transform-and-texture',
	params: {
		transform: Transform,
		texture: Texture,
	},
})

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

			if (isTextureAssetType(asset)) {
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

function getImage(asset: TextureAssets, atlas: AnyAtlas): HTMLCanvasElement | HTMLImageElement {
	if (asset.value) {
		if (is(asset.value, CanvasRenderingContext2D)) {
			return asset.value.canvas
		}
		return asset.value
	}

	loadAsset(asset)

	return asset.fallback(atlas).canvas
}

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
		render2dAfterFrameSystem,
	],
}