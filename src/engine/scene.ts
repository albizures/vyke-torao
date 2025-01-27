import type { Simplify } from 'type-fest'
import type { Runner } from './loop'
import { createSystem, type System, type SystemContext, SystemType, type World } from '../ecs'
import { createSystemCollection, type SystemCollectionArgs } from '../ecs/system-collection'
import { assert } from '../error'
import { ScenePropsRes } from '../resources/scene-props'
import { noop, type OptionalProps } from '../types'

/**
 * A scene is a collection of entities and systems.
 */
export type Scene<TProps = never> = {
	id: string
	enter: (context: SceneContext<TProps>) => void
	beforeExit: () => void
}

export type SceneContext<TProps = never> = {
	props: TProps
	runner: Runner
	world: World
}

type SceneArgs<TProps = never> = {
	id: string
	enter: (context: SceneContext<TProps>) => void
	beforeExit?: (context: SceneContext<TProps>) => void
}

export function createScene<TProps = never>(args: SceneArgs<TProps>): Scene<TProps> {
	const { id, enter, beforeExit = noop } = args

	let savedContext: SceneContext<TProps> | undefined

	return {
		id,
		enter(context: SceneContext<TProps>) {
			savedContext = context
			enter(context)
		},
		beforeExit() {
			assert(savedContext, 'Scene context is not set')
			beforeExit(savedContext)
		},
	}
}

type EnterSceneSystemFn<TProps> = (context: SystemContext, ...args: OptionalProps<TProps>) => void

export type WorldSceneArgs<TProps = never> = Simplify<SystemCollectionArgs & {
	id: string
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
	const { id, enter } = args

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
		id,
		enter(context) {
			const { runner, props } = context

			ScenePropsRes.set(props)
			systems.enter(context)
			runner.start(systems.intoLoop(context))
		},
	})
}
