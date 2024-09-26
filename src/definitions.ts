import type { Assets } from './game'
import { type AnyAsset, type AssetArgs, type AssetType, createAsset } from './assets'
import { createTexture, type Texture, type TextureArgs } from './texture'

type AssetsArgs = Record<string, AssetArgs<AssetType>>

type AssetsFromArgs<TAssetsArgs extends AssetsArgs> = {
	[TKey in keyof TAssetsArgs]: TAssetsArgs[TKey] extends AssetArgs<infer TType> ? AnyAsset<TType> : never
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
