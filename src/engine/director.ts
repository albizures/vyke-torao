import type { OptionalProps } from '../types'
import type { Torao } from './game'
import type { Runner } from './loop'
import type { Scene, WorldSceneArgs } from './scene'

export type AnyScenes = {
	[key: string]: any
}

export type Director<TScenes extends AnyScenes> = {
	runner?: Runner
	goTo: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
	start: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
	scene: <TName extends keyof TScenes>(name: TName, args: WorldSceneArgs<TScenes[TName]>) => Scene<TScenes[TName]>
}

export function createDirector<TScenes extends AnyScenes>(game: Torao): Director<TScenes> {
	function goTo<TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) {
		game.goTo(name as string, ...args)
	}

	const director: Director<TScenes> = {
		goTo,
		start: goTo,
		scene(name, args) {
			return game.scene(name as string, args as WorldSceneArgs<unknown>)
		},
	}

	return director
}
