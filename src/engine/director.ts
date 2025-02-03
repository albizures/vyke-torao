/**
 * @module engine/director
 * Directs the game to different scenes.
 * It works wrapping the game object and adding methods to change scenes giving
 * a better type safety working with scenes.
 */
import type { Simplify } from 'type-fest'
import type { InferEntity, SystemContext } from '../ecs'
import type { SystemCollectionArgs } from '../ecs/system-collection'
import type { OptionalProps } from '../types'
import type { Torao } from './game'
import type { Runner } from './loop'
import type { SceneArgs, SceneContext } from './scene'

type DirectorSceneArgs<TEntity, TProps> = Simplify<SystemCollectionArgs & {
	/**
	 * A function that is called when the scene is entered.
	 * This is where you should create entities and add systems.
	 * Internally, this is a system of type EnterScene that is added to the scene.
	 */
	enter?: (context: SystemContext<InferEntity<TEntity>, TProps>) => void
	beforeExit?: (context: SceneContext<TProps>) => void
	entity: TEntity
}>

export type AnyScenes = {
	[key: string]: any
}

export type Director<TScenes extends AnyScenes> = {
	runner?: Runner
	goTo: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
	start: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
	scene: <TName extends keyof TScenes, TEntity>(name: TName, args: DirectorSceneArgs<TEntity, TScenes[TName]>) => void
}

export function createDirector<TScenes extends AnyScenes>(game: Torao): Director<TScenes> {
	function goTo<TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) {
		game.goTo(name as string, ...args)
	}
	function start<TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) {
		game.start(name as string, ...args)
	}

	const director: Director<TScenes> = {
		goTo,
		start,
		scene(name, args) {
			game.scene(name as string, args as unknown as SceneArgs)
		},
	}

	return director
}
