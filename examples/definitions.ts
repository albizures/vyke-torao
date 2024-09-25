import { type AssetsArgs, AtlasType, loadImage, loadPath2D } from '../src'
import { AssetType } from '../src/assets'

export const assets = {
	coin: {
		id: 'coin',
		type: AssetType.Image,
		loader: loadImage('/assets/images/coin.png'),
	},
	rect: {
		id: 'rect',
		type: AssetType.Path2D,
		loader: loadPath2D((path) => {
			path.rect(0, 0, 32, 32)
		}),
	},
} as const satisfies AssetsArgs

export const atlas = {
	single32x32: {
		type: AtlasType.Single,
		region: {
			width: 32,
			height: 32,
		},
	},
} as const
