import { AtlasType, defineAssets, defineAtlas, defineTextures, loadCanvasContext, loadImage } from '../src'
import { AssetType } from '../src/assets'

export const assets = defineAssets({
	coin: {
		id: 'coin',
		type: AssetType.Image,
		loader: loadImage('/assets/images/coin.png'),
	},
	grid: {
		id: 'grid',
		type: AssetType.Canvas,
		loader: loadCanvasContext(document.createElement('canvas')),
	},
	square: {
		id: 'square',
		type: AssetType.Canvas,
		loader: loadCanvasContext(document.createElement('canvas')),
	},
})

const atlas = defineAtlas({
	single32x32: {
		type: AtlasType.Single,
		region: {
			width: 32,
			height: 32,
		},
	},
	single10x10: {
		type: AtlasType.Single,
		region: {
			width: 10,
			height: 10,
		},
	},
})

export const textures = defineTextures(assets, (assets) => {
	return {
		coin: {
			asset: assets.coin,
			atlas: atlas.single32x32,
		},
	}
})
