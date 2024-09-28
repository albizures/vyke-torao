import type { Loader } from './loader'
import type { AnyAtlas } from './texture'
import { definePlaceholder, type Placeholder } from './placeholders'
import { rootSola } from './sola'

const sola = rootSola.withTag('assets')

export enum AssetType {
	Image = 0,
	Audio = 1,
	Video = 2,
	JSON = 3,
	Text = 4,
	Binary = 5,
	Canvas = 6,
}

export enum AssetStatus {
	Created = 0,
	Loading = 1,
	Loaded = 2,
	Error = 3,
}

type AssetValues<TType extends AssetType> = {
	[AssetType.Image]: HTMLImageElement
	[AssetType.Audio]: HTMLAudioElement
	[AssetType.Video]: HTMLVideoElement
	[AssetType.JSON]: unknown
	[AssetType.Text]: string
	[AssetType.Binary]: ArrayBuffer
	[AssetType.Canvas]: CanvasRenderingContext2D
}[TType]

export class Asset<TType extends AssetType> {
	status = AssetStatus.Created
	fallback: (atlas: AnyAtlas) => Placeholder = definePlaceholder()
	value?: AssetValues<TType>
	constructor(public id: string, public type: TType, public loader: Loader<AssetValues<TType>>) {}
}

export type AnyAsset = {
	[TType in AssetType]: Asset<TType>
}[AssetType]

export type AssetArgs<TType extends AssetType> = {
	[K in AssetType]: {
		id: string
		type: K
		loader: Loader<AssetValues<K>>
	}
}[TType]

export async function loadAsset<TAsset extends AnyAsset>(asset: TAsset): Promise<TAsset> {
	if (asset.status === AssetStatus.Loaded) {
		return asset
	}

	asset.status = AssetStatus.Loading

	try {
		sola.info('Loading asset:', asset.id)
		asset.value = await asset.loader.load()
		asset.status = AssetStatus.Loaded
	}
	catch {
		asset.status = AssetStatus.Error
	}

	return asset
}

export function createAsset<TAssetType extends AssetType>(args: AssetArgs<TAssetType>): Asset<TAssetType> {
	const { id, type, loader } = args

	return new Asset(id, type, loader)
}
