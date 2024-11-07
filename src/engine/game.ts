import type { AnyEntity, AnyEntityCreator, InferEntity } from '../ecs/entity'
import type { OptionalProps } from '../types'
import type { AnyDirectorScenes, Director } from './director'
import type { GamePlugin, ScenePlugin } from './plugin'
import { createWorld, type World } from '../ecs'
import { assert } from '../error'
import { createRequestAnimationFrameRunner, type Runner } from './loop'
import { createWorldScene, type Scene, type WorldSceneArgs } from './scene'

type ToraoArgs<TCreator extends AnyEntityCreator, TScenes extends AnyDirectorScenes> = {
	entity: TCreator
	plugins?: Array<GamePlugin>
	director: Director<TScenes>
	runner?: Runner
}

export type AnyTorao = Torao<any, any>

export type Torao<TEntity extends AnyEntity, TScenes extends AnyDirectorScenes> = {
	world: World<TEntity>
	/**
	 * Create a new scene.
	 */
	scene: <TProps = never>(name: keyof TScenes, args: CreateToraoSceneArgs<TEntity, TProps>) => Scene<TScenes[keyof TScenes]>
	start: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
}

type CreateToraoSceneArgs<TEntity extends AnyEntity, TProps = never> = Omit<WorldSceneArgs<TEntity, TProps>, 'world'>

/**
 * Create a new game.
 * @example
 * ```ts
 * const entity = {
 * 	// ...your components
 * }
 *
 * const director = createDirector<{
 * 	// ...your scenes
 * }>()
 *
 * const game = createGame({
 * 	director,
 * 	entity,
 * })
 * ```
 */
export function createGame<
	TCreator extends AnyEntityCreator,
	TScenes extends AnyDirectorScenes,
	TEntity extends AnyEntity = InferEntity<TCreator>,
>(args: ToraoArgs<TCreator, TScenes>): Torao<TEntity, TScenes> {
	const {
		director,
		runner = createRequestAnimationFrameRunner(),
		plugins: globalPlugins = [],
	} = args

	const scenePlugins = globalPlugins
		.map((plugin) => plugin.scene)
		.filter(Boolean) as Array<ScenePlugin>

	const world = createWorld<TEntity>()

	const game: Torao<TEntity, TScenes> = {
		world,
		scene<TProps = never>(name: keyof TScenes, args: CreateToraoSceneArgs<TEntity, TProps>) {
			const { plugins = [] } = args

			const scene = createWorldScene({
				...args,
				plugins: scenePlugins.concat(plugins),
				world,
			}) as Scene<TScenes[keyof TScenes]>

			director.setScene(name, scene)
			return scene
		},
		start<TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) {
			assert(
				Object.values(director.scenes).length > 0,
				'No scenes added to the director',
				'Did you forget to add scenes to the director?',
			)

			for (const plugin of globalPlugins) {
				if (plugin.beforeStart) {
					plugin.beforeStart(game)
				}
			}

			director.runner = runner
			director.goTo(name, ...args)
		},
	}
	return game
}
