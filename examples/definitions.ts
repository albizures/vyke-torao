import { AtlasType, defineAssets, defineTextures, loadImage, loadPath2D } from '../src'
import { AssetType } from '../src/assets'

export const assets = defineAssets({
	coin: {
		id: 'coin',
		type: AssetType.Image,
		loader: loadImage('/assets/images/coin.png'),
	},
	rect: {
		id: 'rect',
		type: AssetType.Path2D,
		loader: loadPath2D((path) => {
			path.rect(0, 0, 10, 10)
		}),
	},
})

const atlas = {
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
} as const

export const textures = defineTextures(assets, (assets) => {
	return {
		coin: {
			asset: assets.coin,
			atlas: atlas.single32x32,
		},
		rect10x10: {
			asset: assets.rect,
			atlas: atlas.single10x10,
		},
	}
})
