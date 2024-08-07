import { AtlasType, createAtlas, createTexture } from '@vyke/torao/texture'
import type { Vec2d } from '@vyke/torao/vec'
import {
	AssetType,
	createGame,
	createRenderer2d,
	createScene,
	loadImage,
	positionComp,
	textureComp,
} from '@vyke/torao'
import { canvasRect } from '@vyke/torao/resources'
import { createComponent, createQuery, createSystem } from '@vyke/torao/ecs'

const velocityComp = createComponent<Vec2d>({
	label: 'velocity',
})

const withVelocityAndPosition = createQuery({
	label: 'with-velocity-and-position',
	params: {
		velocity: velocityComp,
		position: positionComp,
	},
})

const withPosition = createQuery({
	label: 'with-position',
	params: {
		position: positionComp,
	},
})

const velocityAndPositionSystem = createSystem({
	label: 'velocity-and-position',
	queries: [withVelocityAndPosition],
	update() {
		for (const entity of withVelocityAndPosition.get()) {
			const { position, velocity } = entity.values
			position.x += velocity.x
			position.y += velocity.y
		}
	},
})

const loopSystem = createSystem({
	label: 'loop',
	queries: [withPosition],
	update() {
		const rect = canvasRect.value
		for (const entity of withPosition.get()) {
			const { position } = entity.values
			if (position.x > rect.size.x) {
				position.x = 0
			}

			if (position.x < 0) {
				position.x = rect.size.x
			}

			if (position.y > rect.size.y) {
				position.y = 0
			}

			if (position.y < 0) {
				position.y = rect.size.y
			}
		}
	},
})

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
			velocityComp.entryFrom({ x: 1, y: 1 }),
		],
	})

	defineSystem(velocityAndPositionSystem)
	defineSystem(loopSystem)
})

createGame({
	canvas: document.querySelector('canvas')!,
	renderer: createRenderer2d(),
	scenes: {
		home,
	},
	startScene: 'home',
}).start()
