import type { WithTransform2D } from '../components'
import type { Entity } from '../ecs/world'
import type { Plugin } from '../game'
import type { Vec2D } from '../vec'
import { loadAsset } from '../assets'
import {
	createResource,
	createSystem,
	defineQuery,
	type Query,
	type Resource,
	type System,
	SystemType,
} from '../ecs'
import { camera2DQuery, type WithCamera2D } from '../prefabs'
import { CanvasRes } from '../resources'
import { type AnyAtlas, type Texture as AnyTexture, isTextureAssetType, type TextureAssets } from '../texture'
import { is } from '../types'

type CanvasBufferValue = {
	context: CanvasRenderingContext2D
	buffer: CanvasRenderingContext2D
}

export const CanvasBufferRes: Resource<CanvasBufferValue> = createResource({
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

export type WithTexture2d = {
	texture2D?: AnyTexture
}

type Entity2D = WithTransform2D & WithTexture2d

const render2dEntities: Query<Required<Entity2D>> = defineQuery({
	id: 'with-transform-and-texture',
	with: ['transform2D', 'texture2D'],
})

const render2dBeforeFrameSystem: System<WithCamera2D> = createSystem({
	id: 'renderer-2d-before-frame',
	type: SystemType.BeforeFrame,
	fn(args) {
		const { select } = args
		const camera2d = select(camera2DQuery).first()
		const { buffer, context } = CanvasBufferRes.mutable()

		buffer.clearRect(0, 0, context.canvas.width, context.canvas.height)

		if (camera2d) {
			const { transform2D } = camera2d
			const { position, scale, angle } = transform2D

			buffer.save()
			buffer.translate(position.x, position.y)
			buffer.rotate(angle)
			buffer.scale(scale.x, scale.y)
		}
	},
})

const render2dAfterFrameSystem: System<any> = createSystem({
	id: 'renderer-2d-after-frame',
	type: SystemType.AfterFrame,
	fn() {
		const { buffer, context } = CanvasBufferRes.mutable()

		buffer.restore()
		context.clearRect(0, 0, context.canvas.width, context.canvas.height)
		context.drawImage(buffer.canvas, 0, 0)
	},
})

const renderer2dSystem: System<Entity2D> = createSystem({
	id: 'renderer-2d',
	type: SystemType.Render,
	fn(args) {
		const { select } = args
		const { buffer } = CanvasBufferRes.mutable()

		for (const entity of select(render2dEntities)) {
			const { transform2D, texture2D } = entity
			const { asset, atlas } = texture2D
			const { position, scale, angle } = transform2D

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

const renderer2dEnterSceneSystem: System<Entity2D> = createSystem({
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

type Register = <TEntity extends Entity>(args: Query<TEntity>) => void

export const renderer2d: Plugin = {
	systems: [
		renderer2dEnterSceneSystem,
		renderer2dSystem,
		render2dBeforeFrameSystem,
		render2dAfterFrameSystem,
	],
	queries: (register: Register) => {
		register(render2dEntities)
		register(camera2DQuery)
	},
}
