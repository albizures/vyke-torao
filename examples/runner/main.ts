import { AtlasType, createAtlas, createTexture } from '../../packages/torao/src/texture'
import type { Vec2d } from '../../packages/torao/src/vec'
import type { Disposable } from '../../packages/torao/src'
import {
	AssetType,
	createComponent,
	createGame,
	createRenderer2d,
	createScene,
	disposableBox,
	loadImage,
	positionComp,
	textureComp,
} from '../../packages/torao/src'
import type { System } from '../../packages/torao/src/ecs'
import { createQuery } from '../../packages/torao/src/ecs'

const velocityComp = createComponent({
	label: 'velocity',
	create(args: Vec2d & Disposable) {
		return disposableBox.register(args)
	},
})

const withVelocityAndPosition = createQuery({
	velocity: velocityComp,
	position: positionComp,
})

const velocityAndPositionSystem: System = {
	queries: [withVelocityAndPosition],
	update() {
		for (const entity of withVelocityAndPosition.get()) {
			const { position, velocity } = entity.values
			position.x += velocity.x
			position.y += velocity.y
		}
	},
}

const home = createScene('home', (context) => {
	const { defineEntity, defineAsset, defineSystem } = context
	const coinAsset = defineAsset({
		label: 'coin',
		type: AssetType.Image,
		loader: loadImage('assets/images/coin.png'),
	})

	const coinTexture = createTexture({
		asset: coinAsset,
		atlas: createAtlas({
			type: AtlasType.Single,
			region: {
				x: 0,
				y: 0,
				width: 32,
				height: 32,
			},
		}),
	})

	const _player = defineEntity({
		label: 'player',
		components: [
			positionComp.entryFrom({ x: 0, y: 0 }),
			textureComp.entryFrom(coinTexture),
			velocityComp.entryFrom({ x: 0.5, y: 0 }),
		],
	})

	defineSystem(velocityAndPositionSystem)
})

createGame({
	canvas: document.querySelector('canvas')!,
	renderer: createRenderer2d(),
	scenes: {
		home,
	},
	startScene: 'home',
}).start()
