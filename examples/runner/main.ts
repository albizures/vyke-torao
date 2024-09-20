import { Transform, Velocity } from '@vyke/torao/components'
import { AtlasType, createAtlas, createTexture } from '@vyke/torao/texture'
import { velocityAndTransformSystem } from '@vyke/torao/systems'
import { SystemType, createComponentTag, createQuery, createSystem } from '@vyke/torao/ecs'
import { camera2D, camera2DQuery } from '@vyke/torao/prefabs'
import { Path2DTexture, Texture, renderer2d } from '@vyke/torao/renderers/renderer2d'
import {
	AssetType,
	createCanvas,
	createGame,
	createScene,
	loadImage,
	loadPath2D,
} from '@vyke/torao'

const Player = createComponentTag('player')

// const playerAndTransform = createQuery({
// 	id: 'player-and-transform',
// 	params: {
// 		player: Player,
// 		transform: Transform,
// 	},
// })

// const followPlayerSystem = createSystem({
// 	id: 'follow-player',
// 	queries: {
// 		player: playerAndTransform.required().first(),
// 		camera: camera2DQuery.required().first(),
// 	},
// 	type: SystemType.Update,
// 	fn(args) {
// 		const { entities } = args
// 		const { player, camera } = entities

// 		const { transform } = player.values
// 		const { transform: { position } } = camera.values
// 		Transform.setIn(camera.entity, {
// 			position: {
// 				x: -transform.position.x,
// 				y: position.y,
// 			},
// 		})
// 	},
// })

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

	const rect = defineAsset({
		id: 'rect',
		type: AssetType.Path2D,
		loader: loadPath2D((path) => {
			path.rect(0, 0, 32, 32)
		}),
	})

	const ss = createTexture({
		asset: rect,
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
			Transform.entryFrom({
				position: { x: 50, y: 10 },
			}),
			Texture.entryFrom(coinTexture),
			Texture.entryFrom(ss),
			// Path2DTexture.entryFrom({
			// 	paint(context, path) {
			// 		// context.fillStyle = 'red'
			// 		context.stroke(path)
			// 	},
			// }),
			// Velocity.entryFrom( { x: 2, y: 0 }),
		],
	})

	spawn(camera2D.create({
		id: 'camera',
	}))

	registerSystem(velocityAndTransformSystem)
	// registerSystem(followPlayerSystem)
})

createGame({
	canvas: createCanvas({
		element: document.querySelector('canvas')!,
		resizeMode: 'fill',
	}),
	systems: [
		...renderer2d.systems,
	],
	scenes: {
		home,
	},
	startScene: 'home',
}).start()
