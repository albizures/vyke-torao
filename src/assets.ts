import type { Simplify } from 'type-fest'
import { rootSola } from './sola'
import type { Loader } from './loader'
import { type Placeholder, PlaceholderType, definePlaceholder } from './placeholders'
import type { Rectangle } from './shapes/Rectangle'
import type { Game } from './game'

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

type BaseAsset = {
	id: string
	type: AssetType
	url: string
	load: () => Promise<BaseAsset>
	status: AssetStatus
	fallback: (args: Rectangle) => Placeholder
}

export type ImageAsset = Simplify<BaseAsset & {
	type: AssetType.Image
	use: () => HTMLImageElement
}>
export type AudioAsset = Simplify<BaseAsset & {
	type: AssetType.Audio
	use: () => HTMLAudioElement
}>
export type VideoAsset = Simplify<BaseAsset & {
	type: AssetType.Video
	use: () => HTMLVideoElement
}>
export type JSONAsset = Simplify<BaseAsset & {
	type: AssetType.JSON
	use: () => unknown
}>
export type TextAsset = Simplify<BaseAsset & {
	type: AssetType.Text
	use: () => string
}>

export type BinaryAsset = Simplify<BaseAsset & {
	type: AssetType.Binary
	use: () => ArrayBuffer
}>
export type CanvasAsset = Simplify<BaseAsset & {
	type: AssetType.Canvas
	use: () => HTMLCanvasElement
}>

export type Path2DAsset = Simplify<BaseAsset & {
	type: AssetType.Path2D
	use: () => Path2D
}>

export type AnyAsset =
	| ImageAsset
	| AudioAsset
	| VideoAsset
	| JSONAsset
	| TextAsset
	| BinaryAsset
	| CanvasAsset
	| Path2DAsset

function createBaseAsset<TType extends AssetType>(url: string, type: TType) {
	return {
		status: AssetStatus.Created,
		type,
		url,
		use() {
			throw new Error('Asset not loaded')
		},
	}
}

export type Asset<TValue, TType extends AssetType> = {
	id: string
	type: TType
	url: string
	load: () => Promise<Asset<TValue, TType>>
	status: AssetStatus
	use: () => TValue
	fallback: (args: Rectangle) => Placeholder
}

export type AssetArgs<TValue, TType extends AssetType> = {
	id: string
	type: TType
	loader: Loader<TValue>
}

export function createAsset<TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>): Asset<TValue, TType> {
	const { id, type, loader } = args
	const base = createBaseAsset(id, type)

	const asset: Asset<TValue, TType> = {
		...base,
		id,
		fallback: definePlaceholder(PlaceholderType.Rectangle),
		async load() {
			// futher calls to load will return the same promise
			asset.load = () => Promise.resolve(asset)
			sola.info(`Loading asset: ${id}`)

			asset.status = AssetStatus.Loading

			try {
				const value = await loader()

				asset.status = AssetStatus.Loaded
				asset.use = () => value
			}
			catch {
				asset.status = AssetStatus.Error
			}

			return asset
		},
	}

	return asset
}

// export function createAudioAsset(url: string): AudioAsset {
// 	return {
// 		...createBaseAsset(url, AssetType.Audio),
// 		load() {
// 			const audio = new Audio(url)
// 			audio.addEventListener('canplaythrough', () => {
// 				sola.log(`Loaded audio: ${url}`)
// 			})
// 		},
// 	}
// }

// export function createVideoAsset(url: string): VideoAsset {
// 	return {
// 		...createBaseAsset(url, AssetType.Video),
// 		load() {
// 			const video = document.createElement('video')
// 			video.src = url
// 			video.addEventListener('canplaythrough', () => {
// 				sola.log(`Loaded video: ${url}`)
// 			})
// 		},
// 	}
// }

// export function createJSONAsset(url: string): JSONAsset {
// 	return {
// 		...createBaseAsset(url, AssetType.JSON),
// 		load() {
// 			fetch(url)
// 				.then((response) => response.json())
// 				.then((data) => {
// 					sola.log(`Loaded JSON: ${url}`, data)
// 				})
// 		},
// 	}
// }

// export function createTextAsset(url: string): TextAsset {
// 	return {
// 		...createBaseAsset(url, AssetType.Text),
// 		load() {
// 			fetch(url)
// 				.then((response) => response.text())
// 				.then((text) => {
// 					sola.log(`Loaded text: ${url}`, text)
// 				})
// 		},
// 	}
// }

// export function createBinaryAsset(url: string): BinaryAsset {
// 	return {
// 		...createBaseAsset(url, AssetType.Binary),
// 		load() {
// 			fetch(url)
// 				.then((response) => response.arrayBuffer())
// 				.then((buffer) => {
// 					sola.log(`Loaded binary: ${url}`, buffer)
// 				})
// 		},
// 	}
// }

// export function createCanvasAsset(url: string): CanvasAsset {
// 	return {
// 		...createBaseAsset(url, AssetType.Canvas),
// 		load() {
// 			const canvas = document.createElement('canvas')
// 			const context = canvas.getContext('2d')!
// 			const image = new Image()
// 			image.src = url
// 			image.onload = () => {
// 				canvas.width = image.width
// 				canvas.height = image.height
// 				context.drawImage(image, 0, 0)
// 				sola.log(`Loaded canvas: ${url}`)
// 			}
// 		},
// 	}
// }
