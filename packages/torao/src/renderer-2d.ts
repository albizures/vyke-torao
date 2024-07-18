import { rootSola } from './sola'
import { AssetStatus, AssetType } from './assets'
import { positionComp } from './components/position'
import { textureComp } from './components/texture'
import type { Entity } from './entities'
import type { Renderer } from './renderer'

const _sola = rootSola.withTag('renderer2d')

export function createRenderer2d(): Renderer {
	let context: CanvasRenderingContext2D
	const buffer = document.createElement('canvas').getContext('2d')!

	return {
		render(entities: Set<Entity>) {
			buffer.clearRect(0, 0, context.canvas.width, context.canvas.height)
			for (const entity of entities) {
				const pos = entity.getComponent(positionComp)
				const tex = entity.getComponent(textureComp)

				if (pos && tex) {
					const { asset, atlas } = tex
					if (asset.type === AssetType.Image || asset.type === AssetType.Canvas) {
						if (asset.status === AssetStatus.Error) {
							buffer.drawImage(asset.fallback(atlas.region).canvas,
								atlas.region.x, atlas.region.y,
								atlas.region.width, atlas.region.height,
								pos.x, pos.y,
								atlas.region.width, atlas.region.height,
							)
							continue
						}
						buffer.drawImage(asset.use(),
							atlas.region.x, atlas.region.y,
							atlas.region.width, atlas.region.height,
							pos.x, pos.y,
							atlas.region.width, atlas.region.height,
						)
					}
				}
			}

			context.clearRect(0, 0, context.canvas.width, context.canvas.height)
			context.drawImage(buffer.canvas, 0, 0)
		},
		setup(canvas: HTMLCanvasElement) {
			const { width, height } = canvas

			context = canvas.getContext('2d')!

			buffer.canvas.width = width
			buffer.canvas.height = height
		},
	}
}
