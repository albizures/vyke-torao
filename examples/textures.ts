import { AtlasType, createAtlas, createTexture } from '../src'
import { assets } from './assets'

export const textures = {
	coin: createTexture({
		asset: assets.coin,
		atlas: createAtlas({
			type: AtlasType.Single,
			region: {
				x: 0,
				y: 0,
				width: 32,
				height: 32,
			},
		}),
	}),
}
