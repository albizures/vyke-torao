import type { Vec2d } from '@vyke/torao/vec'
import { Texture, Transform } from '@vyke/torao/components'
import { AtlasType, createAtlas, createTexture } from '@vyke/torao/texture'
import { createComponent, createQuery, createSystem } from '@vyke/torao/ecs'
import {
	AssetType,
	createCanvas,
	createGame,
	createRenderer2d,
	createScene,
	loadImage,
} from '@vyke/torao'

const Velocity = createComponent<Vec2d>({
	label: 'velocity',
})

const withVelocityAndTransform = createQuery({
	label: 'with-velocity-and-position',
	params: {
		velocity: Velocity,
		transform: Transform,
	},
})

const velocityAndTransformSystem = createSystem({
	label: 'velocity-and-position',
	queries: [withVelocityAndTransform],
	update() {
		for (const entity of withVelocityAndTransform.get()) {
			const { transform, velocity } = entity.values
			const { position } = transform
			position.x += velocity.x
			position.y += velocity.y
		}
	},
})

const home = createScene('home', (context) => {
	const { spawn, defineAsset, defineSystem } = context
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

	spawn({
		label: 'player',
		components: [
			Transform.entryFrom({}),
			Texture.entryFrom(coinTexture),
			Velocity.entryFrom({ x: 2, y: 0 }),
		],
	})

	defineSystem(velocityAndTransformSystem)
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
