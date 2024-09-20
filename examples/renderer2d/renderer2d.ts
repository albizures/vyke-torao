import { Transform } from '../../src/components'
import { AtlasType, createAtlas, createTexture } from '../../src/texture'
import { createComponentTag } from '../../src/ecs'
import { camera2D } from '../../src/prefabs'
import { Path2DTexture, Texture, renderer2d } from '../../src/renderers/renderer2d'
import {
	AssetType,
	createCanvas,
	createGame,
	createScene,
	loadImage,
	loadPath2D,
} from '../../src'

const Coin = createComponentTag('coin')
const Square = createComponentTag('square')

const home = createScene('home', (context) => {
	const { spawn, defineAsset } = context

	const coinTexture = createTexture({
		asset: defineAsset({
			id: 'coin',
			type: AssetType.Image,
			loader: loadImage('/assets/images/coin.png'),
		}),
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

	const rect = createTexture({
		asset: defineAsset({
			id: 'rect',
			type: AssetType.Path2D,
			loader: loadPath2D((path) => {
				path.rect(0, 0, 32, 32)
			}),
		}),
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
		id: 'square',
		components: [
			Square.entryFrom(),
			Transform.entryFrom({
				position: { x: 10, y: 10 },
			}),
			Texture.entryFrom(rect),
			Path2DTexture.entryFrom({
				paint(context, path) {
					// context.fillStyle = 'red'
					context.stroke(path)
				},
			}),
		],
	})

	spawn({
		id: 'coin',
		components: [
			Coin.entryFrom(),
			Transform.entryFrom({
				position: { x: 50, y: 10 },
			}),
			Texture.entryFrom(coinTexture),
		],
	})

	spawn(camera2D.create({
		id: 'camera',
	}))
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
