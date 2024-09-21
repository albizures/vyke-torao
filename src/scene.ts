import { type Entity, type EntityArgs, createEntity } from './ecs/entity'
import { createAsset } from './assets'
import type { AnyAsset, Asset, AssetArgs, AssetType } from './assets'
import { COMPONENTS, type Resource, type ResourceArgs, type System, SystemType, createResource } from './ecs'
import { InvalidSystemTypeError } from './error'

/**
 * A buildable scene is a scene that can be built asynchronously.
 */
export type BuildableScene = {
	id: string
	build: (defaultSystem: Set<System>) => Promise<Scene>
}

/**
 * A scene is a collection of entities and systems.
 */
export type Scene = {
	id: string
	entities: Set<Entity>
	systems: {
		fixedUpdate: Set<System>
		update: Set<System>
		render: Set<System>
		enterScene: Set<System>
		beforeFrame: Set<System>
		afterFrame: Set<System>
	}
}

export type SceneContext = {
	entities: Set<Entity>
	defineAsset: <TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>) => Asset<TValue, TType>
	spawn: (args: EntityArgs | Entity) => Entity
	registerSystem: (system: System) => System
	defineResource: <TValue>(args: ResourceArgs<TValue>) => Resource<TValue>
}
type SceneBuilder = (context: SceneContext) => void

/**
 * Creates a scene to be used in the game.
 */
export function createScene(id: string, builder: SceneBuilder): BuildableScene {
	let scene: Scene
	async function build(defaultSystem: Set<System>): Promise<Scene> {
		if (scene) {
			return scene
		}

		const { entities, assets, context, systems } = createSceneContext(defaultSystem)
		builder(context)

		for (const asset of assets) {
			await asset.load()
		}

		const entitiesArray = Array.from(entities)
		const allSystems = [
			...systems.fixedUpdate,
			...systems.update,
			...systems.render,
			...systems.enterScene,
			...systems.beforeFrame,
			...systems.afterFrame,
		]
		for (const system of allSystems) {
			for (const query of system.queries) {
				query.compute(entitiesArray)
			}
		}

		scene = {
			id,
			entities,
			systems,
		}

		return scene
	}

	return {
		id,
		build,
	}
}

function set<TItem>() {
	return new Set<TItem>()
}

function createSceneContext(defaultSystem: Set<System>) {
	const assets = set<AnyAsset>()
	const entities = set<Entity>()
	const render = set<System>()
	const update = set<System>()
	const fixedUpdate = set<System>()
	const resources = set<Resource<unknown>>()
	const enterScene = set<System>()
	const beforeFrame = set<System>()
	const afterFrame = set<System>()

	const byType = {
		[SystemType.FixedUpdate]: fixedUpdate,
		[SystemType.Update]: update,
		[SystemType.Render]: render,
		[SystemType.EnterScene]: enterScene,
		[SystemType.BeforeFrame]: beforeFrame,
		[SystemType.AfterFrame]: afterFrame,
		[SystemType.Setup]: undefined,
	}

	for (const system of defaultSystem) {
		const systems = byType[system.type]

		if (systems) {
			systems.add(system)
		}
	}

	const context: SceneContext = {
		entities,
		defineAsset<TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>): Asset<TValue, TType> {
			const asset = createAsset(args)

			assets.add(asset as AnyAsset)

			return asset
		},
		spawn(args: EntityArgs | Entity): Entity {
			const entity = COMPONENTS in args ? args : createEntity(args)

			entities.add(entity)

			return entity
		},
		registerSystem(system: System): System {
			const systems = byType[system.type]

			if (systems) {
				systems.add(system)
			}
			else {
				throw new InvalidSystemTypeError(system.type)
			}

			return system
		},
		defineResource<TValue>(args: ResourceArgs<TValue>): Resource<TValue> {
			const resource = createResource(args)

			resources.add(resource as Resource<unknown>)
			return resource
		},
	}
	return {
		assets,
		entities,
		context,
		systems: {
			fixedUpdate,
			update,
			render,
			enterScene,
			beforeFrame,
			afterFrame,
		},
	}
}
