import type { Texture } from './texture'
import { type AnyAsset, loadAsset } from './assets'
import { Canvas, type CanvasArgs, createCanvas } from './canvas'
import { createWorld, type Entity, type Resource, type Spawn, type System, SystemType, type World } from './ecs'
import { createRequestAnimationFrameRunner, type LoopValues, type Runner } from './loop'
import { CanvasRes, LoopRes } from './resources'
import { is, map, set } from './types'

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
		[SystemType.FixedUpdate]: set<System<TEntity>>(),
		[SystemType.Update]: set<System<TEntity>>(),
		[SystemType.Render]: set<System<TEntity>>(),
		[SystemType.EnterScene]: set<System<TEntity>>(),
		[SystemType.BeforeFrame]: set<System<TEntity>>(),
		[SystemType.AfterFrame]: set<System<TEntity>>(),
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

/**
 * The status of a scene.
 */
export enum SceneStatus {
	Idle = 0,
	Building = 1,
	Ready = 2,
	Running = 3,
}

type StartupValues<TEntity extends Entity> = {
	systems?: Array<System<TEntity>>
}

export type SceneContext<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures> = {
	assets: TAssets
	textures: TTextures
	spawn: Spawn<TEntity>
}

type SceneBuilder<
	TEntity extends Entity,
	TAssets extends Assets,
	TTextures extends Textures,
> = (context: SceneContext<TEntity, TAssets, TTextures>) => StartupValues<TEntity>

/**
 * A scene is a collection of entities and systems.
 */
type Scene<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures> = {
	id: string
	status: SceneStatus
	builder: SceneBuilder<TEntity, TAssets, TTextures>
	assets: Set<AnyAsset>
	resources: Set<Resource<unknown>>
	systems: SystemBox<TEntity>
	world: World<TEntity>
}

async function buildScene<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures>(scene: Scene<TEntity, TAssets, TTextures>, game: Game<TEntity, TAssets, TTextures>) {
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

	const startup = builder({ assets, textures, spawn: scene.world.spawn })

	registerSystems(scene, startup)

	scene.status = SceneStatus.Ready

	return scene
}

function registerSystems<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures>(scene: Scene<TEntity, TAssets, TTextures>, startup: StartupValues<TEntity>) {
	const { systems } = scene

	for (const system of (startup.systems ?? [])) {
		systems.add(system)
	}
}

// #endregion

// #region Game
type Game<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures> = {
	canvas: Canvas
	textures: TTextures
	scenes: Map<string, Scene<TEntity, TAssets, TTextures>>
	currentScene?: Scene<TEntity, TAssets, TTextures>
	assets: TAssets
}

export type Assets = Record<string, AnyAsset>
export type Textures = Record<string, Texture>

type GameArgs<TAssets extends Assets, TTextures extends Textures> = {
	canvas: Canvas | CanvasArgs
	assets?: TAssets
	textures?: TTextures
}

type CreateGameResult<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures> = {
	game: Game<TEntity, TAssets, TTextures>
	createScene: (id: string, builder: SceneBuilder<TEntity, TAssets, TTextures>) => Scene<TEntity, TAssets, TTextures>
}

export function createGame<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures>(
	args: GameArgs<TAssets, TTextures>,
): CreateGameResult<TEntity, TAssets, TTextures> {
	const { canvas, assets = {} as TAssets, textures = {} as TTextures } = args

	const scenes = map<string, Scene<TEntity, TAssets, TTextures>>()
	const world = createWorld<TEntity>()

	/**
	 * Creates a scene to be used in the game.
	 */
	function createScene(id: string, builder: SceneBuilder<TEntity, TAssets, TTextures>): Scene<TEntity, TAssets, TTextures> {
		const scene: Scene<TEntity, TAssets, TTextures> = {
			id,
			status: SceneStatus.Idle,
			builder,
			assets: set<AnyAsset>(),
			resources: set<Resource<unknown>>(),
			systems: createSystemBox(),
			world,
		}

		scenes.set(id, scene)

		return scene
	}

	const game: Game<TEntity, TAssets, TTextures> = {
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

export async function start<TEntity extends Entity, TAssets extends Assets, TTextures extends Textures>(
	game: Game<TEntity, TAssets, TTextures>,
	scene: Scene<TEntity, TAssets, TTextures>,
	runner: Runner = createRequestAnimationFrameRunner(),
) {
	const { canvas } = game

	CanvasRes.set(canvas)

	await buildScene(scene, game)

	game.currentScene = scene

	startScene(scene, runner)
}

async function startScene<
	TEntity extends Entity,
	TAssets extends Assets,
	TTextures extends Textures,
>(scene: Scene<TEntity, TAssets, TTextures>, runner: Runner) {
	if (scene.status === SceneStatus.Running) {
		return
	}

	if (scene.status !== SceneStatus.Ready) {
		throw new Error('Scene is not ready')
	}

	const { systems } = scene

	const runArgs = {
		spawn: scene.world.spawn,
		select: scene.world.select,
		getEntity: scene.world.entities.getById,
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
