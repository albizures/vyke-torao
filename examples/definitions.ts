import { AssetType, createLoadable, defineAsset } from '../src'

function createContext() {
	const canvas = document.createElement('canvas')

	return canvas.getContext('2d')!
}

export const assets = {
	pino: createLoadable('/assets/images/pino.png', AssetType.Image),
	cloud: createLoadable('/assets/images/cloud.png', AssetType.Image),
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
