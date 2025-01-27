import type { AnyComponents, Query, System } from '../../ecs'
import type { InferEntity } from '../../ecs/entity'
import type { GamePlugin } from '../../engine'
import type { Vec2D } from '../../vec'
import type { Camera2DComponent } from './camera-2d'
import type { SpriteComponent } from './sprite'
import type { Transform2DComponent } from './transform2d'
import { createSystem, defineQuery, SystemType } from '../../ecs'
import { Camera2D, camera2DQuery } from './camera-2d'
import { createCanvas } from './canvas'
import { CanvasBufferRes, HtmlCanvasRectRes, HtmlCanvasRes } from './resources'
import { getSpriteImage, Sprite } from './sprite'
import { Transform2D } from './transform2d'

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

const render2dEntities: Query<[typeof Transform2D, typeof Sprite]> = defineQuery({
	id: 'with-transform-and-texture',
	with: [Transform2D, Sprite],
})

const render2dBeforeFrameSystem: System = createSystem({
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

const renderer2dSystem: System = createSystem({
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

const renderer2dEnterSceneSystem: System = createSystem({
	id: 'renderer-2d-setup',
	type: SystemType.EnterScene,
	fn() {
		const { size } = HtmlCanvasRectRes.value!
		const { canvas, onResize } = HtmlCanvasRes.value!

		const context = canvas.getContext('2d')!
		const buffer = document.createElement('canvas').getContext('2d')!

		function setSize(size: Vec2D) {
			context.canvas.width = size.x
			context.canvas.height = size.y
			buffer.canvas.width = size.x
			buffer.canvas.height = size.y
		}

		onResize(setSize)

		setSize(size)

		CanvasBufferRes.set({ buffer, context })
	},
})

type Register = <TComponents extends AnyComponents>(args: Query<TComponents>) => void

type Canvas2dArgs = {
	element: HTMLElement
} & ({
	resizeMode: 'fill'
} | {
	resizeMode: 'static'
	size: Vec2D
})

export function createCanvas2d(args: Canvas2dArgs): GamePlugin {
	const plugin: GamePlugin = {
		beforeStart() {
			createCanvas(args)
		},
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

	return plugin
}

export * from './camera-2d'
export * from './resources'
export * from './sprite'
export * from './transform2d'
