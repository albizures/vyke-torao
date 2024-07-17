import type { Simplify } from 'type-fest'
import { isOk } from '@vyke/results/result'
import { rootSola } from './sola'
import type { Loader } from './loader'
import { type Placeholder, PlaceholderType, definePlaceholder } from './placeholders'
import type { Rectangle } from './shapes/Rectangle'

const sola = rootSola.withTag('assets')

export enum AssetType {
	Image,
	Audio,
	Video,
	JSON,
	Text,
	Binary,
	Canvas,
}

export enum AssetStatus {
	Created,
	Loading,
	Loaded,
	Error,
}

type BaseAsset = {
	label: string
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

export type AnyAsset = ImageAsset | AudioAsset | VideoAsset | JSONAsset | TextAsset | BinaryAsset | CanvasAsset

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
	label: string
	type: TType
	url: string
	load: () => Promise<Asset<TValue, TType>>
	status: AssetStatus
	use: () => TValue
	fallback: (args: Rectangle) => Placeholder
}

export type AssetArgs<TValue, TType extends AssetType> = {
	label: string
	type: TType
	loader: Loader<TValue>
}

export function createAsset<TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>): Asset<TValue, TType> {
	const { label, type, loader } = args
	const base = createBaseAsset(label, type)

	const asset: Asset<TValue, TType> = {
		...base,
		label,
		fallback: definePlaceholder(PlaceholderType.Rectangle),
		async load() {
			sola.info(`Loading asset: ${label}`)

			asset.status = AssetStatus.Loading

			const value = await loader()

			if (isOk(value)) {
				asset.status = AssetStatus.Loaded
				asset.use = () => value.value
			}
			else {
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
