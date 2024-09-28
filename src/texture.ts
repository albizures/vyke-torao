import type { SetOptional } from 'type-fest'
import type { Region2d } from './region'
import type { Vec2D } from './vec'
import { Asset, type AssetArgs, AssetType, createAsset } from './assets'
import { is } from './types'

export enum AtlasType {
	Single,
	Multiple,
}

export class Atlas {
	region: Region2d
	constructor(public type: AtlasType, rawRegion: SetOptional<Region2d, 'x' | 'y'>) {
		const { x = 0, y = 0 } = rawRegion

		this.region = {
			...rawRegion,
			x,
			y,
		}
	}
}

export class SingleAtlas extends Atlas {
	readonly amount = 1
	constructor(rawRegion: SetOptional<Region2d, 'x' | 'y'>) {
		super(AtlasType.Single, rawRegion)
	}
}

export class MultipleAtlas extends Atlas {
	constructor(
		rawRegion: SetOptional<Region2d, 'x' | 'y'>,
		public size: Vec2D,
		public amount: number,
		public gap: Vec2D = { x: 0, y: 0 },
	) {
		super(AtlasType.Multiple, rawRegion)
	}
}

export type AnyAtlas = SingleAtlas | MultipleAtlas

export type AtlasArgs<TType extends AtlasType> = TType extends AtlasType.Single ? {
	type: TType
	region: SetOptional<Region2d, 'x' | 'y'>
} : {
	type: TType
	region: SetOptional<Region2d, 'x' | 'y'>
	size: Vec2D
	amount: number
	gap?: Vec2D
}

export function createAtlas(args: AtlasArgs<AtlasType> | AnyAtlas): AnyAtlas {
	const { type, region } = args

	if (is(args, Atlas)) {
		return args
	}

	if (type === AtlasType.Single) {
		return new SingleAtlas(region)
	}

	if (type === AtlasType.Multiple) {
		const { size, amount, gap } = args
		return new MultipleAtlas(region, size, amount, gap)
	}

	throw new Error('Invalid atlas type:', type)
}

const textureAssetTypes = [AssetType.Canvas, AssetType.Image] as const

type TextureAssetTypes = typeof textureAssetTypes[number]

export type TextureAssets = {
	[K in TextureAssetTypes]: Asset<K>
}[TextureAssetTypes]

export function isTextureAssetType(asset: unknown): asset is TextureAssetTypes {
	return is(asset, Asset) && textureAssetTypes.includes(asset.type as TextureAssetTypes)
}

export class Texture {
	constructor(public asset: TextureAssets, public atlas: AnyAtlas) {}
}

export type TextureArgs = {
	asset: TextureAssets | AssetArgs<TextureAssetTypes>
	atlas: AtlasArgs<AtlasType> | AnyAtlas
}

export function createTexture(args: TextureArgs): Texture {
	if (is(args, Texture)) {
		return args
	}

	const { asset, atlas } = args

	const finalAsset = asset instanceof Asset ? asset : createAsset(asset) as TextureAssets

	return new Texture(
		finalAsset,
		createAtlas(atlas),
	)
}
