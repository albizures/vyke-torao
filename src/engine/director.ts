import type { Runner } from './loop'
import type { Scene, SceneContext } from './scene'
import { assert } from '../error'

type Scenes = {
	[key: string]: unknown
}

type DirectorScenes<TScenes extends Scenes> = {
	[TName in keyof TScenes]: Scene<TScenes[TName]>
}

export type Director<TScenes extends Scenes> = {
	scenes: DirectorScenes<TScenes>
	currentScene?: Scene<any> | undefined
	runner?: Runner
	setScene: <
		TName extends keyof TScenes,
		TScene extends Scene<TScenes[TName]>,
	>(name: TName, scene: TScene) => void
	transitTo: <TName extends keyof TScenes>(name: TName, props: TScenes[TName]) => void
}

export function createDirector<TScenes extends Scenes>(): Director<TScenes> {
	const director: Director<TScenes> = {
		scenes: {} as DirectorScenes<TScenes>,
		setScene: <
			TName extends keyof TScenes,
			TScene extends Scene<TScenes[TName]>,
		>(name: TName, scene: TScene) => {
			director.scenes[name] = scene
		},

		transitTo<TName extends keyof TScenes>(name: TName, props: TScenes[TName]) {
			const { currentScene, runner } = director
			const scene = director.scenes[name] as Scene<TScenes[TName]>

			assert(scene, `Scene "${String(name)}" does not exist`)
			assert(runner, 'Runner is not set')

			if (currentScene) {
				currentScene.beforeExit()
			}

			const context: SceneContext<TScenes[TName]> = {
				runner,
				props,
			}

			director.currentScene = scene
			scene.enter(context)
		},
	}

	return director
}
