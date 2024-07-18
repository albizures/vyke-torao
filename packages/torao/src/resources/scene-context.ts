import { createResource } from '../ecs'
import type { SceneContext } from '../scene'

const value: SceneContext = {
	entities: new Set(),
	defineAsset: () => {
		throw new Error('Not implemented')
	},
	defineEntity: () => {
		throw new Error('Not implemented')
	},
	defineSystem: () => {
		throw new Error('Not implemented')
	},
	defineResource: () => {
		throw new Error('Not implemented')
	},
}

export const sceneContext = createResource({
	label: 'scene-context',
	value,
})
