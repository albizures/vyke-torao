import { type Entity, type EntityArgs, createEntity } from './entities'
import { createAsset } from './assets'
import type { AnyAsset, Asset, AssetArgs, AssetType } from './assets'

export type BuildableScene = {
	label: string
	build: () => Promise<Scene>
}

export type Scene = {
	label: string
	entities: Set<Entity>
	update: () => void
}

type UpdateFn = () => void
type SceneBuilderContext = {
	entities: Set<Entity>
	defineAsset: <TValue, TType extends AssetType>(args: AssetArgs<TValue, TType>) => Asset<TValue, TType>
	defineEntity: (args: EntityArgs) => Entity
}
type SceneBuilder = (context: SceneBuilderContext) => UpdateFn

export function createScene(label: string, builder: SceneBuilder): BuildableScene {
	async function build() {
		const assets = new Set<AnyAsset>()
		const entities = new Set<Entity>()

		const context = {
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
		}
		const update = builder(context)

		for (const asset of assets) {
			await asset.load()
		}

		return {
			label,
			entities,
			update,
		}
	}

	return {
		label,
		build,
	}
}
