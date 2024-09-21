import { loadImage } from '../src'
import { AssetType, createAsset } from '../src/assets'

export const assets = {
	coin: createAsset({
		id: 'coin',
		type: AssetType.Image,
		loader: loadImage('/assets/images/coin.png'),
	}),
}
