import type { InferEntity } from '../../ecs/entity'
import type { GamePlugin } from '../../engine'
import type { Vec2D } from '../../vec'
import {
	type AnyComponents,
	createResource,
	createSystem,
	defineQuery,
	type Query,
	type Resource,
	type System,
	SystemType,
} from '../../ecs'
import { CanvasRes } from '../../resources'
import { Camera2D, type Camera2DComponent, camera2DQuery } from './camera-2d'
import { getSpriteImage, Sprite, type SpriteComponent } from './sprite'
import { Transform2D, type Transform2DComponent } from './transform2d'

type Canvas2dEntityCreator =
	& Camera2DComponent
	& Transform2DComponent
	& SpriteComponent

export const Canvas2dEntity: Canvas2dEntityCreator = {
	...Camera2D,
	...Transform2D,
	...Sprite,
}

type Canvas2dEntity = InferEntity<Canvas2dEntityCreator>

type CanvasBufferValue = {
	context: CanvasRenderingContext2D
	buffer: CanvasRenderingContext2D
}

const CanvasBufferRes: Resource<CanvasBufferValue> = createResource({
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

const render2dEntities: Query<[typeof Transform2D, typeof Sprite]> = defineQuery({
	id: 'with-transform-and-texture',
	with: [Transform2D, Sprite],
})

const render2dBeforeFrameSystem: System<Canvas2dEntity> = createSystem({
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

const render2dAfterFrameSystem: System = createSystem({
	id: 'renderer-2d-after-frame',
	type: SystemType.AfterFrame,
	fn() {
		const { buffer, context } = CanvasBufferRes.mutable()

		buffer.restore()
		context.clearRect(0, 0, context.canvas.width, context.canvas.height)
		context.drawImage(buffer.canvas, 0, 0)
	},
})

const renderer2dSystem: System<Canvas2dEntity> = createSystem({
	id: 'renderer-2d',
	type: SystemType.Render,
	fn(args) {
		const { select } = args
		const { buffer } = CanvasBufferRes.mutable()

		for (const entity of select(render2dEntities)) {
			const { transform2D, sprite } = entity
			const { atlas } = sprite
			const { position, scale, angle } = transform2D
			const image = getSpriteImage(sprite)

			if (image) {
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

const renderer2dEnterSceneSystem: System<Canvas2dEntity> = createSystem({
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

type Register = <TComponents extends AnyComponents>(args: Query<TComponents>) => void

export const canvas2d: GamePlugin = {
	scene: {
		id: 'renderer-2d',
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
	},
}

export * from './camera-2d'
export * from './sprite'
export * from './transform2d'
