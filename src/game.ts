import type { Texture } from './texture'
import { type AnyAsset, type AssetType, loadAsset } from './assets'
import { Canvas, type CanvasArgs, createCanvas } from './canvas'
import { compute, createEntity, type Entity, type EntityArgs, type Resource, type System, SystemType } from './ecs'
import { createRequestAnimationFrameRunner, type LoopValues, type Runner } from './loop'
import { CanvasRes, LoopRes } from './resources'
import { is, map, set } from './types'

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

type SceneContext<TAssets extends Assets, TTextures extends Textures> = {
	assets: TAssets
	textures: TTextures
}

type SceneBuilder<TAssets extends Assets, TTextures extends Textures> = (context: SceneContext<TAssets, TTextures>) => StartupValues

/**
 * A scene is a collection of entities and systems.
 */
type Scene<TAssets extends Assets, TTextures extends Textures> = {
	id: string
	status: SceneStatus
	builder: SceneBuilder<TAssets, TTextures>
	entities: Set<Entity>
	assets: Set<AnyAsset<AssetType>>
	resources: Set<Resource<unknown>>
	systems: SystemBox
}

async function buildScene<TAssets extends Assets, TTextures extends Textures>(scene: Scene<TAssets, TTextures>, game: Game<TAssets, TTextures>) {
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
			loadAsset(asset)
			return asset
		},
	})

	const textures = new Proxy(game.textures, {
		get(target, prop) {
			const texture = target[prop as string]
			if (!texture) {
				throw new Error(`Texture not found: ${String(prop)}`)
			}

			scene.assets.add(texture.asset)
			loadAsset(texture.asset)
			return texture
		},
	})

	const startup = builder({ assets, textures })

	registerSystems(scene, startup)
	registerEntities(scene, startup)

	scene.status = SceneStatus.Ready

	return scene
}

function registerSystems<TAssets extends Assets, TTextures extends Textures>(scene: Scene<TAssets, TTextures>, startup: StartupValues) {
	const { systems } = scene

	for (const system of (startup.systems ?? [])) {
		systems.add(system)
	}
}

function registerEntities<TAssets extends Assets, TTextures extends Textures>(scene: Scene<TAssets, TTextures>, startup: StartupValues) {
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

// #endregion

// #region Game
type Game<TAssets extends Assets, TTextures extends Textures> = {
	canvas: Canvas
	textures: TTextures
	scenes: Map<string, Scene<TAssets, TTextures>>
	currentScene?: Scene<TAssets, TTextures>
	assets: TAssets
}

export type Assets = Record<string, AnyAsset<AssetType>>
export type Textures = Record<string, Texture>

type GameArgs<TAssets extends Assets, TTextures extends Textures> = {
	canvas: Canvas | CanvasArgs
	assets?: TAssets
	textures?: TTextures
}

type CreateGameResult<TAssets extends Assets, TTextures extends Textures> = {
	game: Game<TAssets, TTextures>
	createScene: (id: string, builder: SceneBuilder<TAssets, TTextures>) => Scene<TAssets, TTextures>
}

export function createGame<TAssets extends Assets, TTextures extends Textures>(
	args: GameArgs<TAssets, TTextures>,
): CreateGameResult<TAssets, TTextures> {
	const { canvas, assets = {} as TAssets, textures = {} as TTextures } = args

	const scenes = map<string, Scene<TAssets, TTextures>>()

	/**
	 * Creates a scene to be used in the game.
	 */
	function createScene(id: string, builder: SceneBuilder<TAssets, TTextures>): Scene<TAssets, TTextures> {
		const scene: Scene<TAssets, TTextures> = {
			id,
			status: SceneStatus.Idle,
			builder,
			entities: set<Entity>(),
			assets: set<AnyAsset<AssetType>>(),
			resources: set<Resource<unknown>>(),
			systems: createSystemBox(),
		}

		scenes.set(id, scene)

		return scene
	}

	const game: Game<TAssets, TTextures> = {
		canvas: is(canvas, Canvas) ? canvas : createCanvas(canvas),
		scenes,
		assets,
		textures,
	}

	return {
		game,
		createScene,
	}
}

export async function start<TAssets extends Assets, TTextures extends Textures>(
	game: Game<TAssets, TTextures>,
	scene: Scene<TAssets, TTextures>,
	runner: Runner = createRequestAnimationFrameRunner(),
) {
	const { canvas } = game

	CanvasRes.set(canvas)

	await buildScene(scene, game)

	game.currentScene = scene

	startScene(scene, runner)
}

async function startScene<TAssets extends Assets, TTextures extends Textures>(scene: Scene<TAssets, TTextures>, runner: Runner) {
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
