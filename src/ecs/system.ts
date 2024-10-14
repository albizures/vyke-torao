import type { AnyEntity } from './entity'
import type { Select, Spawn, Update } from './world'

/**
 * A system is a function that updates the state of the game.
 */
export type System<TEntity extends AnyEntity = AnyEntity> = {
	id: string
	run: (context: SystemContext<TEntity>) => void
	type: SystemType
}

export enum SystemType {
	EnterScene = 0,
	BeforeFrame = 1,
	FixedUpdate = 2,
	Update = 3,
	Render = 4,
	AfterFrame = 5,
	ExitScene = 6,
}

export type SystemContext<TEntity extends AnyEntity> = Readonly<{
	spawn: Spawn<TEntity>
	select: Select
	getEntity: (id: string) => TEntity | undefined
	update: Update<TEntity>
}>

type SystemFn<TEntity extends AnyEntity> = (context: SystemContext<TEntity>) => void

type SystemArgs<TEntity extends AnyEntity> = {
	id: string
	type: SystemType
	onlyWhen?: (args: SystemContext<TEntity>) => boolean
	fn: SystemFn<TEntity>
}

function alwaysTrue() {
	return true
}

export function createSystem<TEntity extends AnyEntity>(args: SystemArgs<TEntity>): System<TEntity> {
	const { id, fn, type, onlyWhen = alwaysTrue } = args

	return {
		id,
		type,
		run(context: SystemContext<TEntity>) {
			const shouldRun = onlyWhen(context)

			if (!shouldRun) {
				return
			}

			fn(context)
		},
	}
}
