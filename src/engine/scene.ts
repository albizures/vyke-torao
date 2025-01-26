import type { Simplify } from 'type-fest'
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

type EnterSceneSystemFn<TProps> = (context: SystemContext, ...args: OptionalProps<TProps>) => void

export type WorldSceneArgs<TProps = never> = Simplify<SystemCollectionArgs & {
	world: World
	/**
	 * A function that is called when the scene is entered.
	 * This is where you should create entities and add systems.
	 * Internally, this is a system of type EnterScene that is added to the scene.
	 */
	enter?: EnterSceneSystemFn<TProps>
}>

export function createWorldScene<TProps = never>(
	args: WorldSceneArgs<TProps>,
): Scene<TProps> {
	const { world, enter } = args

	const systems = createSystemCollection(args)

	if (enter) {
		const enterSystem: System = createSystem({
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

type SceneBuilder = {
	create: <TProps = never>(args: Omit<WorldSceneArgs<TProps>, 'world' | 'plugins'>) => Scene<TProps>
}

type SceneBuilderArgs = {
	world: World
	plugins?: Array<ScenePlugin>
}

export function createSceneBuilder(args: SceneBuilderArgs): SceneBuilder {
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
