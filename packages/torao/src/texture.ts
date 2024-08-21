import { rootSola } from './sola'
import type { AnyAsset, CanvasAsset, ImageAsset } from './assets'
import type { Region2d } from './region'
import type { Vec2D } from './vec'

const _sola = rootSola.withTag('texture')

export enum AtlasType {
	Single,
	Multiple,
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
	type: AtlasType.Multiple
	amount: number
	size: Vec2D
	gap: Vec2D
}

export type AnyAtlas = SingleAtlas | MultipleAtlas

type AtlasArgs<TType extends AtlasType> = TType extends AtlasType.Single ? {
	type: TType
	region: Region2d
} : {
	type: TType
	region: Region2d
	size: Vec2D
	amount: number
	gap?: Vec2D
}

export function createAtlas(args: AtlasArgs<AtlasType.Single>): SingleAtlas
export function createAtlas(args: AtlasArgs<AtlasType.Multiple>): MultipleAtlas
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

	if (type === AtlasType.Multiple) {
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
