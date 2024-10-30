import { assert } from '../error'
import { rootSola } from '../sola'
import { deferedPromise } from '../types'

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

type BaseAsset<TType extends AssetType> = {
	type: TType
	use: Promise<AvailableAsset<TType>>
}

export type AvailableAsset<TType extends AssetType> = BaseAsset<TType> & {
	status: AssetStatus.Loaded
	value: AssetValues<TType>
	url?: string | undefined
}

export type UnavailableAsset<TType extends AssetType> = BaseAsset<TType> & {
	status: AssetStatus.Created | AssetStatus.Loading | AssetStatus.Error
	value?: AssetValues<TType> | undefined
	url: string
}

export type Asset<TType extends AssetType> = UnavailableAsset<TType> | AvailableAsset<TType>

export type AnyAsset = {
	[TType in AssetType]: Asset<TType>
}[AssetType]

export type LoadableAssetArgs = {
	name?: string
	type?: AssetType
}

const assetsById = new Map<string, Asset<any>>()

export function createLoadable<TType extends AssetType>(url: string, type: TType): Asset<TType> {
	const id = `${url}.${type}`

	const storedAsset = assetsById.get(id)

	if (storedAsset) {
		return storedAsset
	}

	const promise = deferedPromise<AvailableAsset<TType>>()

	let value: AssetValues<TType> | undefined
	const asset: Asset<TType> = {
		url,
		type,
		status: AssetStatus.Created,
		get value() {
			return value
		},
		set value(newValue) {
			value = newValue
			asset.status = AssetStatus.Loaded
			promise.resolve(asset as AvailableAsset<TType>)
		},
		use: promise.promise,
	}

	assetsById.set(id, asset)

	return asset
}

type AssetArgs<TType extends AssetType> = {
	value: AssetValues<TType>
	type: TType
}

export function defineAsset<TType extends AssetType>(args: AssetArgs<TType>): Asset<TType> {
	const { value, type } = args

	const promise = deferedPromise<AvailableAsset<TType>>()

	const asset: Asset<TType> = {
		type,
		status: AssetStatus.Loaded,
		value,
		use: promise.promise,
	}

	promise.resolve(asset)

	return asset
}

export async function loadAsset<TType extends AssetType>(asset: Asset<TType>): Promise<Asset<TType>> {
	if (asset.status !== AssetStatus.Created) {
		return asset
	}

	asset.status = AssetStatus.Loading

	try {
		const update = await loadByType(asset)

		return update
	}
	catch {
		asset.status = AssetStatus.Error
	}

	return asset
}

async function loadByType<TType extends AssetType>(asset: Asset<TType>): Promise<Asset<TType>> {
	assert(asset.url, 'Asset url is required', asset)

	const anyAsset = asset as AnyAsset

	switch (anyAsset.type) {
		case AssetType.Image:
			anyAsset.value = await loadImage(asset.url)
			anyAsset.status = AssetStatus.Loaded

			return asset
		default:
			assert(false, `Unknown asset type: ${asset.type}`)
	}
}

export function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = document.createElement('img')

		image.onload = () => {
			sola.info(`Loaded image: ${url}`)
			resolve(image)
		}

		image.onerror = () => {
			sola.error(`Failed to load image: ${url}`)
			reject(new Error(`Failed to load image: ${url}`))
		}

		image.src = url
	})
}
