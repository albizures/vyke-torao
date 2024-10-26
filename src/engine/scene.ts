import type { AnyAsset } from '../assets'
import type { AnyEntity } from '../ecs/entity'
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

type WorldSceneArgs<TEntity extends AnyEntity, TProps = never> = SystemCollectionArgs<TEntity> & {
	world: World<TEntity>
	enter?: EnterSceneSystemFn<TEntity, TProps>
}

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
