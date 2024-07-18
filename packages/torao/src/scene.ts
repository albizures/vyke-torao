import { type Entity, type EntityArgs, createEntity } from './ecs/entity'
import { createAsset } from './assets'
import type { AnyAsset, Asset, AssetArgs, AssetType } from './assets'
import { type Resource, type ResourceArgs, type System, createResource } from './ecs'
import { sceneContext } from './resources/scene-context'

/**
 * A buildable scene is a scene that can be built asynchronously.
 */
export type BuildableScene = {
	label: string
	build: () => Promise<Scene>
}

/**
 * A scene is a collection of entities and systems.
 */
export type Scene = {
	label: string
	entities: Set<Entity>
	systems: Set<System>
	update?: () => void
}

type UpdateFn = () => void
export type SceneContext = {
	entities: Set<Entity>
	defineAsset: <TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>) => Asset<TValue, TType>
	defineEntity: (args: EntityArgs) => Entity
	defineSystem: (args: System) => System
	defineResource: <TValue>(args: ResourceArgs<TValue>) => Resource<TValue>
}
type SceneBuilder = (context: SceneContext) => UpdateFn | void

/**
 * Creates a scene to be used in the game.
 */
export function createScene(label: string, builder: SceneBuilder): BuildableScene {
	let scene: Scene
	async function build() {
		if (scene) {
			return scene
		}

		const { entities, assets, context, systems } = createSceneContext()
		const update = builder(context) ?? undefined

		for (const asset of assets) {
			await asset.load()
		}

		const entitiesArray = Array.from(entities)
		for (const system of systems) {
			for (const query of system.queries) {
				query.compute(entitiesArray)
			}
		}

		sceneContext.set(context)

		scene = {
			label,
			update,
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
	const systems = new Set<System>()
	const resources = new Set<Resource<unknown>>()

	const context: SceneContext = {
		entities,
		defineAsset<TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>): Asset<TValue, TType> {
			const asset = createAsset(args)

			assets.add(asset as AnyAsset)

			return asset
		},
		defineEntity(args: EntityArgs): Entity {
			const entity = createEntity(args)

			entities.add(entity)

			return entity
		},
		defineSystem(system: System): System {
			systems.add(system)
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
		systems,
	}
}
