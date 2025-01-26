import type { OptionalProps } from '../types'
import type { AnyDirectorScenes, Director } from './director'
import type { GamePlugin, ScenePlugin } from './plugin'
import { createWorld, type World } from '../ecs'
import { assert } from '../error'
import { createRequestAnimationFrameRunner, type Runner } from './loop'
import { createWorldScene, type Scene, type WorldSceneArgs } from './scene'

type ToraoArgs<TScenes extends AnyDirectorScenes> = {
	plugins?: Array<GamePlugin>
	director: Director<TScenes>
	runner?: Runner
}

export type AnyTorao = Torao<any>

export type Torao<TScenes extends AnyDirectorScenes> = {
	world: World
	/**
	 * Create a new scene.
	 */
	scene: <TProps = never>(name: keyof TScenes, args: CreateToraoSceneArgs<TProps>) => Scene<TScenes[keyof TScenes]>
	start: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
}

type CreateToraoSceneArgs<TProps = never> = Omit<WorldSceneArgs<TProps>, 'world'>

/**
 * Create a new game.
 * @example
 * ```ts
 * const entity = {
 * 	// ...your components
 * }
 *
 * const director = createDirector<{
 * home: never,
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
	TScenes extends AnyDirectorScenes,
>(args: ToraoArgs<TScenes>): Torao<TScenes> {
	const {
		director,
		runner = createRequestAnimationFrameRunner(),
		plugins: globalPlugins = [],
	} = args

	const scenePlugins = globalPlugins
		.map((plugin) => plugin.scene)
		.filter(Boolean) as Array<ScenePlugin>

	const world = createWorld()

	const game: Torao<TScenes> = {
		world,
		scene<TProps = never>(name: keyof TScenes, args: CreateToraoSceneArgs<TProps>) {
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
