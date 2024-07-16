import { rootSola } from './sola'
import type { AnyAsset, CanvasAsset, ImageAsset } from './assets'
import type { Region2d } from './region'
import type { Vec2d } from './vec'

const _sola = rootSola.withTag('texture')

export enum AtlasType {
	Single,
	Mutiple,
}

type BaseAtlas = {
	type: AtlasType
	region: Region2d
}

export type SingleAtlas = BaseAtlas & {
	type: AtlasType.Single
	amount: 1
}

export type MultipleAtlas = BaseAtlas & {
	type: AtlasType.Mutiple
	amount: number
	size: Vec2d
	gap: Vec2d
}

export type AnyAtlas = SingleAtlas | MultipleAtlas

type AtlasArgs<TType extends AtlasType> = TType extends AtlasType.Single ? {
	type: TType
	region: Region2d
} : {
	type: TType
	region: Region2d
	size: Vec2d
	amount: number
	gap?: Vec2d
}

export function createAtlas(args: AtlasArgs<AtlasType.Single>): SingleAtlas
export function createAtlas(args: AtlasArgs<AtlasType.Mutiple>): MultipleAtlas
export function createAtlas<TType extends AtlasType>(args: AtlasArgs<TType>): AnyAtlas {
	const { type } = args

	if (type === AtlasType.Single) {
		const { region } = args
		return {
			type,
			region,
			amount: 1,
		}
	}

	if (type === AtlasType.Mutiple) {
		const { size, amount, region, gap = { x: 0, y: 0 } } = args
		return {
			type,
			region,
			size,
			amount,
			gap,
		}
	}

	throw new Error('Invalid atlas type:', type)
}

export type AnyTexture = {
	asset: AnyAsset
	atlas: AnyAtlas
}

export type ImageTexture = AnyTexture & {
	asset: ImageAsset
}

export type CanvasTexture = AnyTexture & {
	asset: CanvasAsset
}

type TextureArgs = {
	asset: AnyAsset
	atlas: AnyAtlas
}

export function createTexture(args: TextureArgs): AnyTexture {
	const { asset, atlas } = args

	return {
		asset,
		atlas,
	}
}
