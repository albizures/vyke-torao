import { AssetType, createLoadable, defineAsset } from '../src/assets'

function createContext() {
	const canvas = document.createElement('canvas')

	return canvas.getContext('2d')!
}

export const assets = {
	coin: createLoadable('/assets/images/coin.png', AssetType.Image),
	grid: defineAsset({
		type: AssetType.Canvas,
		value: createContext(),
	}),
	square: defineAsset({
		type: AssetType.Canvas,
		value: createContext(),
	}),
}
