import { AtlasType, createAtlas, createTexture } from '@vyke/torao/texture'
import type { Vec2d } from '@vyke/torao/vec'
import {
	AssetType,
	createCanvas,
	createGame,
	createRenderer2d,
	createScene,
	loadImage,
} from '@vyke/torao'
import { Body, positionComp, textureComp } from '@vyke/torao/components'
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

const withPositionAndBody = createQuery({
	label: 'with-position-and-body',
	params: {
		position: positionComp,
		body: Body,
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
	queries: [withPositionAndBody],
	update() {
		const rect = canvasRect.value
		for (const entity of withPositionAndBody.get()) {
			const { position, body } = entity.values

			if (position.x > rect.size.x) {
				position.x = -body.x
			}

			if (position.x < -body.x) {
				position.x = rect.size.x
			}

			if (position.y > rect.size.y) {
				position.y = -body.y
			}

			if (position.y < -body.y) {
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
			velocityComp.entryFrom({ x: 2, y: -1 }),
			Body.entryFrom({ x: 32, y: 32 }),
		],
	})

	defineSystem(velocityAndPositionSystem)
	defineSystem(loopSystem)
})

createGame({
	canvas: createCanvas({
		element: document.querySelector('canvas')!,
		resizeMode: 'fill',
	}),
	renderer: createRenderer2d(),
	scenes: {
		home,
	},
	startScene: 'home',
}).start()
