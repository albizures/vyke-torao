import type { AnyAsset } from './assets'
import type { Entity } from './ecs/entity'
import type { Spawn } from './ecs/world'
import type { Texture } from './texture'
import { Canvas, type CanvasArgs, createCanvas } from './canvas'
import { type Query, type Resource, type System, SystemType, type World } from './ecs'
import { createRequestAnimationFrameRunner, type LoopValues, type Runner } from './loop'
import { CanvasRes, LoopRes } from './resources'
import { is, map, noop, set } from './types'

type SystemIterator<TEntity extends Entity> = Iterable<System<TEntity>>

type SystemBox<TEntity extends Entity> = {
	all: SystemIterator<TEntity>
	fixedUpdate: SystemIterator<TEntity>
	update: SystemIterator<TEntity>
	render: SystemIterator<TEntity>
	enterScene: SystemIterator<TEntity>
	beforeFrame: SystemIterator<TEntity>
	afterFrame: SystemIterator<TEntity>
	add: (system: System<TEntity>) => void
	remove: (system: System<TEntity>) => void
	size: () => number
}

function createSystemBox<TEntity extends Entity>(): SystemBox<TEntity> {
	const allSystems = set<System<TEntity>>()
	const byType = {
		[SystemType.EnterScene]: set<System<TEntity>>(),
		[SystemType.FixedUpdate]: set<System<TEntity>>(),
		[SystemType.BeforeFrame]: set<System<TEntity>>(),
		[SystemType.Update]: set<System<TEntity>>(),
		[SystemType.Render]: set<System<TEntity>>(),
		[SystemType.AfterFrame]: set<System<TEntity>>(),
		[SystemType.ExitScene]: set<System<TEntity>>(),
	}

	function add(system: System<TEntity>) {
		allSystems.add(system)
		byType[system.type].add(system)
	}

	function remove(system: System<TEntity>) {
		allSystems.delete(system)
		byType[system.type].delete(system)
	}

	function size() {
		return allSystems.size
	}

	return {
		all: allSystems,
		fixedUpdate: byType[SystemType.FixedUpdate],
		update: byType[SystemType.Update],
		render: byType[SystemType.Render],
		enterScene: byType[SystemType.EnterScene],
		beforeFrame: byType[SystemType.BeforeFrame],
		afterFrame: byType[SystemType.AfterFrame],
		add,
		remove,
		size,
	}
}

// #region Scene

export type Register = <TEntity extends Entity>(args: Query<TEntity>) => void

export type ScenePlugin = {
	id: string
	queries?: (register: Register) => void
	systems?: Array<System<any>>
}

export type SceneContext<TEntity extends Entity> = {
	spawn: Spawn<TEntity>
}

type SceneStartup<
	TEntity extends Entity,
> = (context: SceneContext<TEntity>) => void

/**
 * A scene is a collection of entities and systems.
 */
type Scene<TEntity extends Entity > = {
	id: string
	startup: SceneStartup<TEntity>
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
			startup,
			assets: set<AnyAsset>(),
			resources: set<Resource<unknown>>(),
			systems: createSystemBox(),
			world,
		}

		registerSystems(scene, systems)
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

	const runArgs = {
		spawn: scene.world.spawn,
		select: scene.world.select,
		getEntity: scene.world.entities.getById,
	}

	scene.startup(runArgs)

	for (const system of systems.enterScene) {
		system.run(runArgs)
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
			system.run(runArgs)
		}
	}

	function afterFrame() {
		for (const system of systems.afterFrame) {
			system.run(runArgs)
		}
	}

	function update() {
		for (const system of systems.update) {
			system.run(runArgs)
		}
	}

	function render() {
		for (const system of systems.render) {
			system.run(runArgs)
		}
	}

	function fixedUpdate(args: LoopValues) {
		LoopRes.set(args)
		for (const system of systems.fixedUpdate) {
			system.run(runArgs)
		}
	}
}

// #endregion
