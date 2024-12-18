import type { Simplify } from 'type-fest'
import type { AnyEntity } from '../ecs/entity'
import type { AnyAsset } from './assets'
import type { Runner } from './loop'
import type { ScenePlugin } from './plugin'
import { createSystem, type System, type SystemContext, SystemType, type World } from '../ecs'
import { createSystemCollection, type SystemCollectionArgs } from '../ecs/system-collection'
import { assert } from '../error'
import { ScenePropsRes } from '../resources/scene-props'
import { noop, type OptionalProps } from '../types'

/**
 * A scene is a collection of entities and systems.
 */
export type Scene<TProps = never> = {
	id?: string
	assets: Set<AnyAsset>
	enter: (context: SceneContext<TProps>) => void
	beforeExit: () => void
}

export type SceneContext<TProps = never> = {
	props: TProps
	runner: Runner
}

type SceneArgs<TProps = never> = {
	enter: (context: SceneContext<TProps>) => void
	beforeExit?: (context: SceneContext<TProps>) => void
}

export function createScene<TProps = never>(args: SceneArgs<TProps>): Scene<TProps> {
	const { enter, beforeExit = noop } = args

	let savedContext: SceneContext<TProps> | undefined

	return {
		enter(context: SceneContext<TProps>) {
			savedContext = context
			enter(context)
		},
		beforeExit() {
			assert(savedContext, 'Scene context is not set')
			beforeExit(savedContext)
		},
		assets: new Set(),
	}
}

type EnterSceneSystemFn<
	TEntity extends AnyEntity,
	TProps,
> = (context: SystemContext<TEntity>, ...args: OptionalProps<TProps>) => void

export type WorldSceneArgs<TEntity extends AnyEntity, TProps = never> = Simplify<SystemCollectionArgs<TEntity> & {
	world: World<TEntity>
	/**
	 * A function that is called when the scene is entered.
	 * This is where you should create entities and add systems.
	 * Internally, this is a system of type EnterScene that is added to the scene.
	 */
	enter?: EnterSceneSystemFn<TEntity, TProps>
}>

export function createWorldScene<TEntity extends AnyEntity, TProps = never>(
	args: WorldSceneArgs<TEntity, TProps>,
): Scene<TProps> {
	const { world, enter } = args

	const systems = createSystemCollection(args)

	if (enter) {
		const enterSystem: System<TEntity> = createSystem({
			id: `enter-scene`,
			type: SystemType.EnterScene,
			fn(context) {
				enter(context, ...[ScenePropsRes.mutable()] as OptionalProps<TProps>)
			},
		})

		systems.box.add(enterSystem)
	}

	return createScene({
		enter(context) {
			const { runner, props } = context

			ScenePropsRes.set(props)
			runner.start(systems.intoLoop(world))
		},
	})
}

type SceneBuilder<TEntity extends AnyEntity> = {
	create: <TProps = never>(args: Omit<WorldSceneArgs<TEntity, TProps>, 'world' | 'plugins'>) => Scene<TProps>
}

type SceneBuilderArgs<TEntity extends AnyEntity> = {
	world: World<TEntity>
	plugins?: Array<ScenePlugin>
}

export function createSceneBuilder<TEntity extends AnyEntity>(args: SceneBuilderArgs<TEntity>): SceneBuilder<TEntity> {
	const { world, plugins = [] } = args

	return {
		create(args) {
			const scene = createWorldScene({
				...args,
				world,
				plugins,
			})

			return scene
		},
	}
}
