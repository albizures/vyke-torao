import type { Simplify } from 'type-fest'
import type { System, SystemContext, World } from '../ecs'
import type { SystemCollection, SystemCollectionArgs } from '../ecs/system-collection'
import type { Runner } from './loop'
import { createSystem, SystemType } from '../ecs'
import { createSystemCollection } from '../ecs/system-collection'
import { assert } from '../error'
import { ScenePropsRes } from '../resources/scene-props'

export type EnterSceneSystemFn<TProps> = (context: SystemContext<TProps>) => void

/**
 * A scene is a collection of entities and systems.
 */
export type Scene = {
	id: string
	systems: SystemCollection
	enter: (context: SceneContext<unknown>) => void
	exit: () => void
}

export type SceneContext<TProps = never> = {
	props: TProps
	runner: Runner
	world: World
}

export type SceneArgs = Simplify<SystemCollectionArgs & {
	id: string
	/**
	 * A function that is called when the scene is entered.
	 * This is where you should create entities and add systems.
	 * Internally, this is a system of type EnterScene that is added to the scene.
	 */
	enter?: EnterSceneSystemFn<unknown>
	beforeExit?: (context: SceneContext<unknown>) => void
}>

export function createScene(args: SceneArgs): Scene {
	const { id, enter, beforeExit } = args

	const systems = createSystemCollection(args)
	let savedContext: SceneContext<unknown> | undefined
	if (enter) {
		const enterSystem: System = createSystem({
			id: `enter-scene`,
			type: SystemType.EnterScene,
			fn: enter,
		})

		systems.box.add(enterSystem)
	}

	if (beforeExit) {
		const beforeExitSystem: System = createSystem({
			id: `before-exit-scene`,
			type: SystemType.BeforeExitScene,
			fn() {
				assert(savedContext, 'Scene context is not set')
				beforeExit(savedContext)
			},
		})

		systems.box.add(beforeExitSystem)
	}

	return {
		id,
		systems,
		enter(context: SceneContext<unknown>) {
			savedContext = context

			const { runner, props } = context

			ScenePropsRes.set(props)
			systems.enter(context)
			runner.start(systems.intoLoop(context))
		},
		exit() {
			assert(savedContext, 'Scene context is not set')
			systems.beforeExit(savedContext)
		},
	}
}
