import { type Entity, type EntityArgs, createEntity } from './entities'
import { createAsset } from './assets'
import type { AnyAsset, Asset, AssetArgs, AssetType } from './assets'
import type { System } from './ecs/system'

export type BuildableScene = {
	label: string
	build: () => Promise<Scene>
}

export type Scene = {
	label: string
	entities: Set<Entity>
	systems: Set<System>
	update?: () => void
}

type UpdateFn = () => void
type SceneBuilderContext = {
	entities: Set<Entity>
	defineAsset: <TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>) => Asset<TValue, TType>
	defineEntity: (args: EntityArgs) => Entity
	defineSystem: (args: System) => System
}
type SceneBuilder = (context: SceneBuilderContext) => UpdateFn | void

export function createScene(label: string, builder: SceneBuilder): BuildableScene {
	async function build() {
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

		return {
			label,
			update,
			entities,
			systems,
		}
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

	const context: SceneBuilderContext = {
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
	}
	return {
		assets,
		entities,
		context,
		systems,
	}
}
