import { AtlasType, createTexture } from '../src'
import { assets } from './assets'

export const textures = {
	coin: createTexture({
		asset: assets.coin,
		atlas: {
			type: AtlasType.Single,
			region: {
				width: 32,
				height: 32,
			},
		},
	}),
}
