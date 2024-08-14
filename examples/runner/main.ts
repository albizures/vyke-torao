import { Texture, Transform, Velocity } from '@vyke/torao/components'
import { AtlasType, createAtlas, createTexture } from '@vyke/torao/texture'
import { velocityAndTransformSystem } from '@vyke/torao/systems'
import { createComponentTag, createQuery, createSystem } from '@vyke/torao/ecs'
import {
	AssetType,
	createCanvas,
	createGame,
	createRenderer2d,
	createScene,
	loadImage,
} from '@vyke/torao'
import { camera2D, camera2DQuery } from '@vyke/torao/prefabs'

const Player = createComponentTag('player')

const playerAndTransform = createQuery({
	id: 'player-and-transform',
	params: {
		player: Player,
		transform: Transform,
	},
})

const followPlayerSystem = createSystem({
	id: 'follow-player',
	queries: {
		player: playerAndTransform.required().first(),
		camera: camera2DQuery.required().first(),
	},
	update(args) {
		const { entities } = args
		const { player, camera } = entities

		const { transform } = player.values
		const { transform: { position } } = camera.values
		Transform.setValue(camera.entity, {
			...transform,
			position: {
				x: -transform.position.x,
				y: position.y,
			},
		})
	},
})

const home = createScene('home', (context) => {
	const { spawn, defineAsset, registerSystem } = context
	const coinAsset = defineAsset({
		id: 'coin',
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
		id: 'player',
		components: [
			Player.entryFrom(),
			Transform.entryFrom({}),
			Texture.entryFrom(coinTexture),
			Velocity.entryFrom({ x: 2, y: 0 }),
		],
	})

	spawn(camera2D.create({
		id: 'camera',
	}))

	registerSystem(velocityAndTransformSystem)
	registerSystem(followPlayerSystem)
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
