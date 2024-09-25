import type { SetOptional } from 'type-fest'
import type { Loader } from './loader'
import type { Region2d } from './region'
import type { Vec2D } from './vec'
import { Asset, type AssetType, type CanvasAsset, createAsset, type ImageAsset, type Path2DAsset } from './assets'
import { is } from './types'

export enum AtlasType {
	Single,
	Multiple,
}

class Atlas {
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

	if (args instanceof Atlas) {
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

export class Texture {
	constructor(public asset: CanvasAsset | ImageAsset | Path2DAsset, public atlas: AnyAtlas) {}
}

export type TextureArgs = {
	asset: ImageAsset | CanvasAsset | Path2DAsset | {
		id: string
		type: AssetType.Image
		loader: Loader<HTMLImageElement>
	} | {
		id: string
		type: AssetType.Canvas
		loader: Loader<HTMLCanvasElement>
	} | {
		id: string
		type: AssetType.Path2D
		loader: Loader<Path2D>
	}
	atlas: AtlasArgs<AtlasType> | AnyAtlas
}

export function createTexture(args: TextureArgs): Texture {
	if (args instanceof Texture) {
		return args
	}

	const { asset, atlas } = args

	return new Texture(
		is(asset, Asset) ? asset : createAsset(asset),
		createAtlas(atlas),
	)
}
