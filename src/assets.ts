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
	Path2D = 7,
}

export enum AssetStatus {
	Created = 0,
	Loading = 1,
	Loaded = 2,
	Error = 3,
}

export class Asset {
	status = AssetStatus.Created
	fallback: (atlas: AnyAtlas) => Placeholder = definePlaceholder()
	constructor(public id: string, public type: AssetType) {}
}

export class ImageAsset extends Asset {
	value?: HTMLImageElement
	constructor(id: string, public loader: Loader<HTMLImageElement>) {
		super(id, AssetType.Image)
	}
}

export class AudioAsset extends Asset {
	value?: HTMLAudioElement
	constructor(id: string, public loader: Loader<HTMLAudioElement>) {
		super(id, AssetType.Audio)
	}
}

export class VideoAsset extends Asset {
	value?: HTMLVideoElement
	constructor(id: string, public loader: Loader<HTMLVideoElement>) {
		super(id, AssetType.Video)
	}
}

export class JSONAsset extends Asset {
	value?: unknown
	constructor(id: string, public loader: Loader<unknown>) {
		super(id, AssetType.JSON)
	}
}

export class TextAsset extends Asset {
	value?: string
	constructor(id: string, public loader: Loader<string>) {
		super(id, AssetType.Text)
	}
}

export class BinaryAsset extends Asset {
	value?: ArrayBuffer
	constructor(id: string, public loader: Loader<ArrayBuffer>) {
		super(id, AssetType.Binary)
	}
}

export class CanvasAsset extends Asset {
	value?: HTMLCanvasElement
	constructor(id: string, public loader: Loader<HTMLCanvasElement>) {
		super(id, AssetType.Canvas)
	}
}

export class Path2DAsset extends Asset {
	value?: Path2D
	constructor(id: string, public loader: Loader<Path2D>) {
		super(id, AssetType.Path2D)
	}
}

export type AnyAsset<TType extends AssetType> = Assets[TType]

type Assets = {
	[AssetType.Audio]: AudioAsset
	[AssetType.Image]: ImageAsset
	[AssetType.Video]: VideoAsset
	[AssetType.JSON]: JSONAsset
	[AssetType.Text]: TextAsset
	[AssetType.Binary]: BinaryAsset
	[AssetType.Canvas]: CanvasAsset
	[AssetType.Path2D]: Path2DAsset
}

type AssetArgs<TType extends AssetType> = {
	id: string
	type: TType
	loader: Loader<NonNullable<Assets[TType]['value']>>
}

export async function loadAsset<TAsset extends AnyAsset<AssetType>>(asset: TAsset): Promise<TAsset> {
	if (asset.status === AssetStatus.Loaded) {
		return asset
	}

	asset.status = AssetStatus.Loading

	try {
		sola.info('Loading asset:', asset.id)
		asset.value = await asset.loader()
		asset.status = AssetStatus.Loaded
	}
	catch {
		asset.status = AssetStatus.Error
	}

	return asset
}

const byType = {
	[AssetType.Image]: (id: string, loader: Loader<HTMLImageElement>) => new ImageAsset(id, loader),
	[AssetType.Audio]: (id: string, loader: Loader<HTMLAudioElement>) => new AudioAsset(id, loader),
	[AssetType.Video]: (id: string, loader: Loader<HTMLVideoElement>) => new VideoAsset(id, loader),
	[AssetType.JSON]: (id: string, loader: Loader<unknown>) => new JSONAsset(id, loader),
	[AssetType.Text]: (id: string, loader: Loader<string>) => new TextAsset(id, loader),
	[AssetType.Binary]: (id: string, loader: Loader<ArrayBuffer>) => new BinaryAsset(id, loader),
	[AssetType.Canvas]: (id: string, loader: Loader<HTMLCanvasElement>) => new CanvasAsset(id, loader),
	[AssetType.Path2D]: (id: string, loader: Loader<Path2D>) => new Path2DAsset(id, loader),
}

export function createAsset<TAssetType extends AssetType>(args: AssetArgs<TAssetType>): AnyAsset<TAssetType> {
	const { id, type } = args

	const create = byType[type]
	if (create) {
		const { loader } = args
		return create(id, loader as any) as AnyAsset<TAssetType>
	}

	throw new Error(`Invalid asset type: ${type}`)
}
