import { type Entity, type EntityArgs, createEntity } from './ecs/entity'
import { createAsset } from './assets'
import type { AnyAsset, Asset, AssetArgs, AssetType } from './assets'
import { COMPONENTS, type Resource, type ResourceArgs, type System, createResource } from './ecs'
import { Transform } from './components'

/**
 * A buildable scene is a scene that can be built asynchronously.
 */
export type BuildableScene = {
	label: string
	build: (renderSystems: Set<System>) => Promise<Scene>
}

/**
 * A scene is a collection of entities and systems.
 */
export type Scene = {
	label: string
	entities: Set<Entity>
	systems: {
		update: Set<System>
		render: Set<System>
	}
}

export type SceneContext = {
	entities: Set<Entity>
	defineAsset: <TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>) => Asset<TValue, TType>
	spawn: (args: EntityArgs | Entity) => Entity
	defineSystem: (args: System) => System
	defineResource: <TValue>(args: ResourceArgs<TValue>) => Resource<TValue>
}
type SceneBuilder = (context: SceneContext) => void

/**
 * Creates a scene to be used in the game.
 */
export function createScene(label: string, builder: SceneBuilder): BuildableScene {
	let scene: Scene
	async function build(renderSystems: Set<System>): Promise<Scene> {
		if (scene) {
			return scene
		}

		const { entities, assets, context, systems } = createSceneContext()
		systems.render = renderSystems
		builder(context)

		for (const asset of assets) {
			await asset.load()
		}

		const entitiesArray = Array.from(entities)
		for (const system of [...systems.render, ...systems.update]) {
			for (const query of system.queries) {
				query.compute(entitiesArray)
			}
		}

		scene = {
			label,
			entities,
			systems,
		}

		return scene
	}

	return {
		label,
		build,
	}
}

function createSceneContext() {
	const assets = new Set<AnyAsset>()
	const entities = new Set<Entity>()
	const renderSystems = new Set<System>()
	const updateSystems = new Set<System>()
	const resources = new Set<Resource<unknown>>()

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
		defineSystem(system: System): System {
			updateSystems.add(system)
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
			update: updateSystems,
			render: renderSystems,
		},
	}
}
