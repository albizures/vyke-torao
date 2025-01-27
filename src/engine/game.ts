import type { GamePlugin, ScenePlugin } from './plugin'
import { createWorld, type World } from '../ecs'
import { assert } from '../error'
import { rootSola } from '../sola'
import { map } from '../types'
import { createRequestAnimationFrameRunner, type Runner } from './loop'
import { createWorldScene, type Scene, type SceneContext, type WorldSceneArgs } from './scene'

const sola = rootSola.withTag('game')

type ToraoArgs = {
	plugins?: Array<GamePlugin>
	runner?: Runner
}

export type AnyTorao = Torao

export type Torao = {
	world: World
	readonly currentScene: string | undefined
	/**
	 * Create a new scene.
	 */
	scene: (name: string, args: WorldSceneArgs<unknown>) => Scene<unknown>
	start: (name: string, props?: unknown) => void
	goTo: (name: string, props?: unknown) => void
}

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
export function createGame(args: ToraoArgs): Torao {
	const {
		runner = createRequestAnimationFrameRunner(),
		plugins: globalPlugins = [],
	} = args

	const scenePlugins = globalPlugins
		.map((plugin) => plugin.scene)
		.filter(Boolean) as Array<ScenePlugin>

	const world = createWorld()
	const scenes = map<string, Scene<unknown>>()
	let currentScene: string | undefined

	const game: Torao = {
		world,
		get currentScene() {
			return currentScene
		},
		scene(name: string, args: WorldSceneArgs<unknown>) {
			const { plugins = [] } = args

			const scene = createWorldScene({
				...args,
				plugins: scenePlugins.concat(plugins),
			}) as Scene<unknown>

			scenes.set(name, scene)
			return scene
		},
		start(name: string, props: unknown) {
			assert(
				scenes.size > 0,
				'No scenes added to the director',
				'Did you forget to add scenes to the director?',
			)

			for (const plugin of globalPlugins) {
				if (plugin.beforeStart) {
					plugin.beforeStart(game)
				}
			}

			game.goTo(name, props)
		},
		goTo(name: string, props: unknown) {
			const scene = scenes.get(name) as Scene<unknown>

			assert(scene, `Scene "${String(name)}" does not exist`)

			if (currentScene) {
				const current = scenes.get(currentScene)
				if (current) {
					sola.info('Going to scene', name, 'from', current.id)
					current.beforeExit()
				}
			}
			else {
				sola.info('Going to scene', name)
			}

			const context: SceneContext<unknown> = {
				runner,
				world,
				props,
			}

			currentScene = name

			scene.enter(context)
		},
	}
	return game
}
