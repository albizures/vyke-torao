import type { AnyCreators, Query, System } from '../../ecs'
import type { GamePlugin } from '../../engine'
import type { Vec2d } from '../../vec'
import { createSystem, defineEntity, defineQuery, SystemType } from '../../ecs'
import { Camera2dEntity, camera2DQuery } from './camera-2d'
import { createCanvas } from './canvas'
import { CanvasBufferRes, HtmlCanvasRectRes, HtmlCanvasRes } from './resources'
import { getSpriteImage, SpriteEntity } from './sprite'
import { Transform2dEntity } from './transform2d'

export const Canvas2dEntity = defineEntity({
	...Camera2dEntity,
	...Transform2dEntity,
	...SpriteEntity,
})

const { transform2d, sprite } = Canvas2dEntity

const render2dEntities: Query<[typeof transform2d, typeof sprite]> = defineQuery({
	id: 'with-transform-and-texture',
	with: [transform2d, sprite],
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
			const { transform2d } = camera2d
			const { position, scale, angle } = transform2d

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
			const { transform2d, sprite } = entity
			const { atlas } = sprite
			const { position, scale, angle } = transform2d
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

		function setSize(size: Vec2d) {
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

type Register = <TComponents extends AnyCreators>(args: Query<TComponents>) => void

type Canvas2dArgs = {
	element: HTMLElement
} & ({
	resizeMode: 'fill'
} | {
	resizeMode: 'static'
	size: Vec2d
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
