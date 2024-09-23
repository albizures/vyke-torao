import type { AnyAsset } from './assets'
import type { Canvas as CanvasValue } from './canvas'
import type { Resource } from './ecs'
import { compute, createEntity, type Entity, type EntityArgs, type System, SystemType } from './ecs/alt'
import { createRequestAnimationFrameRunner, type LoopValues, type Runner } from './loop'
import { Canvas, Loop } from './resources'

type SystemIterator = Iterable<System>

type SystemBox = {
	all: SystemIterator
	fixedUpdate: SystemIterator
	update: SystemIterator
	render: SystemIterator
	enterScene: SystemIterator
	beforeFrame: SystemIterator
	afterFrame: SystemIterator
	add: (system: System) => void
	remove: (system: System) => void
	size: () => number
}

function createSystemBox(): SystemBox {
	const allSystems = set<System>()
	const byType = {
		[SystemType.FixedUpdate]: set<System>(),
		[SystemType.Update]: set<System>(),
		[SystemType.Render]: set<System>(),
		[SystemType.EnterScene]: set<System>(),
		[SystemType.BeforeFrame]: set<System>(),
		[SystemType.AfterFrame]: set<System>(),
	}

	function add(system: System) {
		allSystems.add(system)
		byType[system.type].add(system)
	}

	function remove(system: System) {
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

/**
 * The status of a scene.
 */
export enum SceneStatus {
	Idle = 0,
	Building = 1,
	Ready = 2,
	Running = 3,
}

type StartupValues = {
	systems?: Array<System>
	entities?: Array<Entity>
}

type SceneContext<TAssets extends Assets> = {
	assets: TAssets
}

type SceneBuilder<TAssets extends Assets> = (context: SceneContext<TAssets>) => StartupValues

/**
 * A scene is a collection of entities and systems.
 */
export type Scene<TAssets extends Assets> = {
	id: string
	status: SceneStatus
	builder: SceneBuilder<TAssets>
	entities: Set<Entity>
	assets: Set<AnyAsset>
	resources: Set<Resource<unknown>>
	systems: SystemBox
}

async function buildScene<TAssets extends Assets>(scene: Scene<TAssets>, game: Game<TAssets>) {
	const { builder } = scene

	if (scene.status !== SceneStatus.Idle) {
		return scene
	}

	scene.status = SceneStatus.Building

	const assets = new Proxy(game.assets, {
		get(target, prop) {
			const asset = target[prop as string]
			if (!asset) {
				throw new Error(`Asset not found: ${String(prop)}`)
			}

			scene.assets.add(asset)
			asset.load()
			return asset
		},
	})

	const startup = builder({ assets })

	registerSystems(scene, startup)
	registerEntities(scene, startup)

	scene.status = SceneStatus.Ready

	return scene
}

function registerSystems<TAssets extends Assets>(scene: Scene<TAssets>, startup: StartupValues) {
	const { systems } = scene

	for (const system of (startup.systems ?? [])) {
		systems.add(system)
	}
}

function registerEntities<TAssets extends Assets>(scene: Scene<TAssets>, startup: StartupValues) {
	const { systems } = scene
	const entities = startup.entities ?? []

	for (const system of systems.all) {
		for (const query of system.queries) {
			compute(query, entities)
		}
	}

	for (const entity of entities) {
		scene.entities.add(entity)
	}
}

function set<TItem>(values?: Iterable<TItem>): Set<TItem> {
	return new Set<TItem>(values)
}

function map<TKeys, TValues>(entries?: Array<[TKeys, TValues]>): Map<TKeys, TValues> {
	return new Map<TKeys, TValues>(entries)
}

// #endregion

// #region Game
export type Game<TAssets extends Assets> = {
	canvas: CanvasValue
	scenes: Map<string, Scene<TAssets>>
	currentScene?: Scene<TAssets>
	assets: TAssets
}

type Assets = Record<string, AnyAsset>

type GameArgs<TAssets extends Assets> = {
	canvas: CanvasValue
	assets: TAssets
}

type GreateGameResult<TAssets extends Assets> = {
	game: Game<TAssets>
	createScene: (id: string, builder: SceneBuilder<TAssets>) => Scene<TAssets>
}

export function createGame<TAssets extends Assets>(args: GameArgs<TAssets>): GreateGameResult<TAssets> {
	const { canvas, assets } = args

	const scenes = map<string, Scene<TAssets>>()

	/**
	 * Creates a scene to be used in the game.
	 */
	function createScene(id: string, builder: SceneBuilder<TAssets>): Scene<TAssets> {
		const scene: Scene<TAssets> = {
			id,
			status: SceneStatus.Idle,
			builder,
			entities: set<Entity>(),
			assets: set<AnyAsset>(),
			resources: set<Resource<unknown>>(),
			systems: createSystemBox(),
		}

		scenes.set(id, scene)

		return scene
	}

	const game: Game<TAssets> = {
		canvas,
		scenes,
		assets,
	}

	return {
		game,
		createScene,
	}
}

export async function start<TAssets extends Assets>(
	game: Game<TAssets>,
	scene: Scene<TAssets>,
	runner: Runner = createRequestAnimationFrameRunner(),
) {
	const { canvas } = game

	Canvas.set(canvas)

	await buildScene(scene, game)

	game.currentScene = scene

	startScene(scene, runner)
}

async function startScene<TAssets extends Assets>(scene: Scene<TAssets>, runner: Runner) {
	if (scene.status === SceneStatus.Running) {
		return
	}

	if (scene.status !== SceneStatus.Ready) {
		throw new Error('Scene is not ready')
	}

	const { systems } = scene

	const runArgs = {
		spawn,
	}

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

	scene.status = SceneStatus.Running

	function spawn(args: EntityArgs) {
		const entity = createEntity(args)
		scene.entities.add(entity)
		return entity
	}

	function beforeFrame(args: LoopValues) {
		Loop.set(args)
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
		Loop.set(args)
		for (const system of systems.fixedUpdate) {
			system.run(runArgs)
		}
	}
}

// #endregion
