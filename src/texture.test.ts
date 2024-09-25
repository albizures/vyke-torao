import { describe, expect, it } from 'vitest'
import { AssetType, ImageAsset } from './assets'
import { loadImage } from './loader'
import { AtlasType, createTexture, SingleAtlas } from './texture'

describe('texture', () => {
	it('createTexture', () => {
		const texture = createTexture({
			asset: {
				id: 'test',
				type: AssetType.Image,
				loader: loadImage('image.png'),
			},
			atlas: {
				type: AtlasType.Single,
				region: { width: 10, height: 10 },
			},
		})

		expect(texture).toEqual({
			asset: expect.any(ImageAsset),
			atlas: expect.any(SingleAtlas),
		})
	})
})
