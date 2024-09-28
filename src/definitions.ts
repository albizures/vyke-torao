import type { Assets } from './game'
import { type Asset, type AssetArgs, type AssetType, createAsset } from './assets'
import { type AnyAtlas, type AtlasArgs, type AtlasType, createAtlas, createTexture, type Texture, type TextureArgs } from './texture'

type AssetsArgs = Record<string, AssetArgs<AssetType>>

export type AssetsFromArgs<TAssetsArgs extends AssetsArgs> = {
	[TKey in keyof TAssetsArgs]: TAssetsArgs[TKey]['type'] extends AssetType
		? Asset<TAssetsArgs[TKey]['type']>
		: never
}

export function defineAssets<TAssetsArgs extends AssetsArgs>(assets: TAssetsArgs): AssetsFromArgs<TAssetsArgs> {
	type TAssets = AssetsFromArgs<TAssetsArgs>
	return Object.fromEntries(
		Object.entries(assets ?? {}).map(([id, asset]) => {
			return [id, createAsset(asset)]
		}),
	) as TAssets
}

type TexturesFromArgs<TTexturesArgs extends TexturesArgs> = {
	[TKey in keyof TTexturesArgs]: TTexturesArgs[TKey] extends TextureArgs ? Texture : never
}

type TexturesArgs = Record<string, TextureArgs>
type DefineTextures<TTexturesArgs extends TexturesArgs, TAssets extends Assets> = ((assets: TAssets) => TTexturesArgs) | TTexturesArgs

export function defineTextures<
	TTexturesArgs extends TexturesArgs,
	TAssets extends Assets,
>(assets: TAssets, textures: DefineTextures<TTexturesArgs, TAssets>): TexturesFromArgs<TTexturesArgs> {
	type TTextures = TexturesFromArgs<TTexturesArgs>
	const textureArgs: TTexturesArgs = typeof textures === 'function' ? textures(assets) : textures
	const entries: Array<[string, Texture]> = Object.entries(textureArgs).map(([id, texture]) => {
		return [id, createTexture(texture)] as const
	})

	return Object.fromEntries(entries) as TTextures
}

type AtlasArgRecord = Record<string, AtlasArgs<AtlasType>>
type AtlasFromArgs<TAtlasArgs extends AtlasArgRecord> = {
	[TKey in keyof TAtlasArgs]: AnyAtlas
}

export function defineAtlas<TAtlasArgs extends AtlasArgRecord>(atlases: TAtlasArgs): AtlasFromArgs<TAtlasArgs> {
	type TAtlas = AtlasFromArgs<TAtlasArgs>
	const entries: Array<[string, AnyAtlas]> = Object.entries(atlases ?? {}).map(([id, atlas]) => {
		return [id, createAtlas(atlas)]
	})
	return Object.fromEntries(entries) as TAtlas
}
