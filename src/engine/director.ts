import type { OptionalProps } from '../types'
import type { Runner } from './loop'
import type { Scene, SceneContext } from './scene'
import { assert } from '../error'
import { rootSola } from '../sola'

const sola = rootSola.withTag('director')

export type AnyDirectorScenes = {
	[key: string]: unknown
}

type DirectorScenes<TScenes extends AnyDirectorScenes> = {
	[TName in keyof TScenes]: Scene<TScenes[TName]>
}

export type Director<TScenes extends AnyDirectorScenes> = {
	scenes: DirectorScenes<TScenes>
	currentScene?: Scene<any> | undefined
	runner?: Runner
	setScene: <
		TName extends keyof TScenes,
		TScene extends Scene<TScenes[TName]>,
	>(name: TName, scene: TScene) => void
	goTo: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
}

export function createDirector<TScenes extends AnyDirectorScenes>(): Director<TScenes> {
	const director: Director<TScenes> = {
		scenes: {} as DirectorScenes<TScenes>,
		setScene: <
			TName extends keyof TScenes,
			TScene extends Scene<TScenes[TName]>,
		>(name: TName, scene: TScene) => {
			director.scenes[name] = scene
			scene.id = String(name)
		},

		goTo<TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) {
			const { currentScene, runner } = director
			const scene = director.scenes[name] as Scene<TScenes[TName]>

			assert(scene, `Scene "${String(name)}" does not exist`)
			assert(runner, 'Runner is not set')

			if (currentScene) {
				sola.info('Going to scene', name, 'from', currentScene.id)
				currentScene.beforeExit()
			}
			else {
				sola.info('Going to scene', name)
			}

			const [props] = args

			const context: SceneContext<TScenes[TName]> = {
				runner,
				props: props as TScenes[TName],
			}

			director.currentScene = scene
			scene.enter(context)
		},
	}

	return director
}
