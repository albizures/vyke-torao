import type { Entity } from './entity'
import type { Select, Spawn } from './world'

/**
 * A system is a function that updates the state of the game.
 */
export type System<TEntity extends Entity = Entity> = {
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

export type SystemContext<TEntity extends Entity> = Readonly<{
	spawn: Spawn<TEntity>
	select: Select<TEntity>
	getEntity: (id: string) => TEntity | undefined
}>

type SystemFn<TEntity extends Entity> = (context: SystemContext<TEntity>) => void

type SystemArgs<TEntity extends Entity> = {
	id: string
	type: SystemType
	onlyWhen?: (args: SystemContext<TEntity>) => boolean
	fn: SystemFn<TEntity>
}

function alwaysTrue() {
	return true
}

export function createSystem<TEntity extends Entity>(args: SystemArgs<TEntity>): System<TEntity> {
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
