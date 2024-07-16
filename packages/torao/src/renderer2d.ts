import { rootSola } from './sola'
import { AssetType } from './assets'
import { positionComp } from './components/position'
import { textureComp } from './components/texture'
import type { Entity } from './entities'
import type { Renderer } from './renderer'

const _sola = rootSola.withTag('renderer2d')

export function createRenderer2d(): Renderer {
	let context: CanvasRenderingContext2D

	return {
		render(entities: Set<Entity>) {
			for (const entity of entities) {
				const pos = entity.getComponent(positionComp)
				const tex = entity.getComponent(textureComp)

				if (pos && tex) {
					const { asset, atlas } = tex
					if (asset.type === AssetType.Image || asset.type === AssetType.Canvas) {
						context.drawImage(asset.use(),
							pos.x, pos.y,
							atlas.region.width, atlas.region.height,
							atlas.region.x, atlas.region.y,
							atlas.region.width, atlas.region.height,
						)
					}
				}
			}
		},
		setup(canvas: HTMLCanvasElement) {
			const { width, height } = canvas

			context = canvas.getContext('2d')!

			canvas.width = width
			canvas.height = height
		},
	}
}
