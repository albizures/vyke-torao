import type { AnyAsset } from './assets'
import type { Entity } from './ecs/entity'
import type { Texture } from './texture'
import { createSystemBox, type SystemBox } from './boxes/system-box'
import { Canvas, type CanvasArgs, createCanvas } from './canvas'
import { createSystem, type Query, type Resource, type System, type SystemContext, SystemType, type World } from './ecs'
import { createRequestAnimationFrameRunner, type LoopValues, type Runner } from './loop'
import { CanvasRes, LoopRes } from './resources'
import { is, map, noop, set } from './types'

// #region Scene

export type Register = <TEntity extends Entity>(args: Query<TEntity>) => void

export type ScenePlugin = {
	id: string
	queries?: (register: Register) => void
	systems?: Array<System<any>>
}

type SceneStartup<
	TEntity extends Entity,
> = (context: SystemContext<TEntity>) => void

/**
 * A scene is a collection of entities and systems.
 */
type Scene<TEntity extends Entity > = {
	id: string
	assets: Set<AnyAsset>
	resources: Set<Resource<unknown>>
	systems: SystemBox<TEntity>
	world: World<TEntity>
}

function registerSystems<
	TEntity extends Entity,
>(scene: Scene<TEntity>, initSystems: Array<System<TEntity>> = []) {
	const { systems } = scene

	for (const system of initSystems) {
		systems.add(system)
	}
}

function registerPlugin<TEntity extends Entity>(scene: Scene<TEntity>, plugin: ScenePlugin) {
	const { queries = noop, systems } = plugin

	queries(scene.world.registerQuery)

	registerSystems(scene, systems)
}

// #endregion

// #region Game
type Game = {
	canvas: Canvas
	scenes: Map<string, Scene<Entity>>
	currentScene?: Scene<Entity>
}

export type Assets = Record<string, AnyAsset>
export type Textures = Record<string, Texture>

type GameArgs = {
	canvas: Canvas | CanvasArgs
}

type CreateGameResult = {
	game: Game
	createScene: <TEntity extends Entity>(args: SceneArgs<TEntity>) => Scene<TEntity>
}

type SceneArgs<TEntity extends Entity> = {
	id: string
	world: World<TEntity>
	startup?: SceneStartup<TEntity>
	systems?: Array<System<TEntity>>
	plugins?: Array<ScenePlugin>
}

export function createGame(
	args: GameArgs,
): CreateGameResult {
	const { canvas } = args

	const scenes = map<string, Scene< Entity>>()

	/**
	 * Creates a scene to be used in the game.
	 */
	function createScene<TEntity extends Entity>(args: SceneArgs<TEntity>): Scene<TEntity> {
		const { id, world, startup = noop, systems = [], plugins = [] } = args

		const scene: Scene<TEntity> = {
			id,
			assets: set<AnyAsset>(),
			resources: set<Resource<unknown>>(),
			systems: createSystemBox(),
			world,
		}

		const startupSystem: System<TEntity> = createSystem({
			id: `startup-${id}`,
			type: SystemType.EnterScene,
			fn: startup,
		})

		registerSystems(scene, [...systems, startupSystem])
		for (const plugin of plugins ?? []) {
			registerPlugin(scene, plugin)
		}

		scenes.set(id, scene)

		return scene
	}

	const game: Game = {
		canvas: is(canvas, Canvas) ? canvas : createCanvas(canvas),
		scenes,
	}

	return {
		game,
		createScene,
	}
}

export async function start<TEntity extends Entity>(
	game: Game,
	scene: Scene<TEntity>,
	runner: Runner = createRequestAnimationFrameRunner(),
) {
	const { canvas } = game

	CanvasRes.set(canvas)

	game.currentScene = scene

	startScene(scene, runner)
}

async function startScene<
	TEntity extends Entity,
>(scene: Scene<TEntity>, runner: Runner) {
	const { systems } = scene

	const systemContext: SystemContext<Entity> = {
		spawn: scene.world.spawn,
		select: scene.world.select,
		getEntity: scene.world.entities.getById,
	}

	for (const system of systems.enterScene) {
		system.run(systemContext)
	}

	runner.start({
		fixedUpdate,
		update,
		render,
		beforeFrame,
		afterFrame,
	})

	function beforeFrame(args: LoopValues) {
		LoopRes.set(args)
		for (const system of systems.beforeFrame) {
			system.run(systemContext)
		}
	}

	function afterFrame() {
		for (const system of systems.afterFrame) {
			system.run(systemContext)
		}
	}

	function update() {
		for (const system of systems.update) {
			system.run(systemContext)
		}
	}

	function render() {
		for (const system of systems.render) {
			system.run(systemContext)
		}
	}

	function fixedUpdate(args: LoopValues) {
		LoopRes.set(args)
		for (const system of systems.fixedUpdate) {
			system.run(systemContext)
		}
	}
}

// #endregion
