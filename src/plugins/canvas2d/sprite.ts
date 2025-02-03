import type { SetOptional } from 'type-fest'
import type { AnyAsset, Asset } from '../../engine'
import type { Region2d } from '../../region'
import type { Vec2d } from '../../vec'
import { defineEntity } from '../../ecs/entity'
import { AssetType, loadAsset } from '../../engine'
import { is } from '../../types'
import { getPlaceholder } from './placeholders'

export type SpriteAsset = Asset<AssetType.Image> | Asset<AssetType.Canvas>

export type Atlas = {
	region: Region2d
	grid?: Vec2d | undefined
	gap?: Vec2d | undefined
}

export type Sprite = {
	asset: SpriteAsset
	atlas: Atlas
}

function isSpriteAsset(asset: AnyAsset): asset is SpriteAsset {
	return [AssetType.Canvas, AssetType.Image].includes(asset.type)
}

type SpriteArgs = {
	asset: SpriteAsset
	region: SetOptional<Region2d, 'x' | 'y'>
	grid?: Partial<Vec2d>
	gap?: Partial<Vec2d>
}

export const SpriteEntity = defineEntity({
	sprite: (args: SpriteArgs): Sprite => {
		const { asset, region, grid, gap } = args

		return {
			asset,
			atlas: {
				region: {
					...region,
					...completeVec2d(region, { x: 0, y: 0 }),
				},
				grid: grid && completeVec2d(grid, { x: 1, y: 1 }),
				gap: gap && completeVec2d(gap, { x: 0, y: 0 }),
			},
		}
	},
})

function completeVec2d(partial: Partial<Vec2d>, defaults: Vec2d): Vec2d {
	return {
		x: partial.x ?? defaults.x,
		y: partial.y ?? defaults.y,
	}
}

export function getSpriteImage(sprite: Sprite): HTMLCanvasElement | HTMLImageElement | undefined {
	const { asset, atlas } = sprite
	if (!isSpriteAsset(asset)) {
		return undefined
	}

	if (asset.value) {
		if (is(asset.value, CanvasRenderingContext2D)) {
			return asset.value.canvas
		}
		return asset.value
	}

	loadAsset(asset)

	return getPlaceholder(atlas).canvas
}
