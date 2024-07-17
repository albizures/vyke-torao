import { AtlasType, createAtlas, createTexture } from '../../packages/torao/src/texture'
import {
	AssetType,
	createGame,
	createRenderer2d,
	createScene,
	loadImage,
	position,
	texture,
} from '../../packages/torao/src'

const home = createScene('home', (context) => {
	const { defineEntity, defineAsset } = context
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
			position.entryFrom({ x: 0, y: 0 }),
			texture.entryFrom(coinTexture),
		],
	})

	return () => {
		// sola.log('update')
	}
})

createGame({
	canvas: document.querySelector('canvas')!,
	renderer: createRenderer2d(),
	scenes: {
		home,
	},
	startScene: 'home',
}).start()
