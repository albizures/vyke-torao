import type { World } from '../ecs'
import type { Runner } from './loop'
import type { GamePlugin, ScenePlugin } from './plugin'
import type { Scene, SceneArgs, SceneContext } from './scene'
import { createWorld } from '../ecs'
import { assert } from '../error'
import { rootSola } from '../sola'
import { map } from '../types'
import { createRequestAnimationFrameRunner } from './loop'
import { createScene } from './scene'

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
	scene: (name: string, args: Omit<SceneArgs, 'id'>) => Scene
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
 * 	home: never,
 * 	// ...your scenes
 * }>()
 *
 * const game = createGame({
 * 	director,
 * 	entity,
 * })
 * ```
 */
export function createGame(args: ToraoArgs = {}): Torao {
	const {
		runner = createRequestAnimationFrameRunner(),
		plugins: globalPlugins = [],
	} = args

	const scenePlugins = globalPlugins
		.map((plugin) => plugin.scene)
		.filter(Boolean) as Array<ScenePlugin>

	const world = createWorld()
	const scenes = map<string, Scene>()
	let currentScene: string | undefined

	const game: Torao = {
		world,
		get currentScene() {
			return currentScene
		},
		scene(name, args) {
			const { plugins = [] } = args

			const scene = createScene({
				...args,
				id: name,
				plugins: scenePlugins.concat(plugins),
			}) as Scene

			scenes.set(name, scene)
			return scene
		},
		start(name, props) {
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
		goTo(name, props) {
			const scene = scenes.get(name)

			assert(scene, `Scene "${String(name)}" does not exist`)

			if (currentScene) {
				const current = scenes.get(currentScene)
				if (current) {
					sola.info('Going to scene', name, 'from', current.id)
					current.exit()
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
