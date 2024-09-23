import type { AnyAtlas, AnyTexture } from '../texture'
import { AssetStatus, AssetType, type CanvasAsset, type ImageAsset } from '../assets'
import { createComponent, createQuery, createSystem, type EntityArgs, entryFrom, first, required, SystemType } from '../ecs/alt'
import { Canvas } from '../resources'
import { vec2D, type Vec2D } from '../vec'
import { CanvasBuffer } from './renderer2d'

export const Texture = createComponent<AnyTexture>({
	id: 'texture',
})

type Path2DTextureValue = {
	paint: (context: CanvasRenderingContext2D, path: Path2D) => void
}

export const Path2DTexture = createComponent<Path2DTextureValue>({
	id: 'path2d-texture',
})

type TransformData = {
	position: Vec2D
	/**
	 * Rotation in radians.
	 */
	angle: number
	scale: Vec2D
}

export const Transform = createComponent<TransformData, Partial<TransformData>>({
	id: 'transform',
	create(args: Partial<TransformData>) {
		const { position = vec2D(0, 0), angle = 0, scale = vec2D(1, 1) } = args
		return {
			position,
			angle,
			scale,
		}
	},
})

export type Prefab<TArgs> = {
	id: string
	create: (args: TArgs) => EntityArgs
}

export function createPrefab<TArgs>(args: Prefab<TArgs>): Prefab<TArgs> {
	return { ...args }
}

type Camera2DArgs = {
	id: string
	position?: Vec2D
	scale?: Vec2D
	angle?: number
}

const Camera2D = createComponent({
	id: 'camera-2d',
})

export const camera2D = createPrefab({
	id: 'Camera 2D',
	create: (args: Camera2DArgs) => {
		const { id } = args
		const entity = {
			id,
			components: [
				entryFrom(Transform, args),
				entryFrom(Camera2D, {}),
			],
		}

		return entity
	},
})

const render2dEntities = createQuery({
	id: 'with-transform-and-texture',
	params: {
		transform: Transform,
		texture: Texture,
	},
	filters: [
		{
			component: Path2DTexture,
			type: 'without',
		},
	],
})

const render2dPath2dEntities = createQuery({
	id: 'with-transform-and-path2d-texture',
	params: {
		transform: Transform,
		texture2d: Path2DTexture,
		texture: Texture,
	},
})

const camera2DQuery = createQuery({
	id: 'Camera 2D Query',
	params: {
		transform: Transform,
		camera2D: Camera2D,
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
		const { buffer, context } = CanvasBuffer.mutable()

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
		const { buffer, context } = CanvasBuffer.mutable()

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

		const { buffer } = CanvasBuffer.mutable()

		for (const entity of entitiesToRender) {
			const { transform, texture } = entity.values
			const { asset, atlas } = texture
			const { position, scale, angle } = transform

			if (asset.type === AssetType.Image || asset.type === AssetType.Canvas) {
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
	if (asset.status === AssetStatus.Loaded) {
		return asset.use()
	}

	asset.load()

	return asset.fallback(atlas.region).canvas
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
		const { buffer } = CanvasBuffer.mutable()

		for (const entity of entitiesToRender) {
			const { transform, texture, texture2d } = entity.values

			const { asset } = texture
			const { position, scale, angle } = transform

			if (asset.type !== AssetType.Path2D) {
				throw new Error('Path2D asset expected')
			}
			if (asset.status === AssetStatus.Error) {
				throw new Error('Path2D asset is in error state')
			}

			buffer.save()
			buffer.translate(position.x, position.y)
			buffer.rotate(angle)
			buffer.scale(scale.x, scale.y)

			texture2d.paint(buffer, asset.use())
			buffer.restore()
		}
	},
})

const renderer2dSetupSystem = createSystem({
	id: 'renderer-2d-setup',
	type: SystemType.EnterScene,
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

export const renderer2d = {
	systems: [
		renderer2dSetupSystem,
		renderer2dSystem,
		render2dBeforeFrameSystem,
		render2dPath2dSystem,
		render2dAfterFrameSystem,
	],
}
