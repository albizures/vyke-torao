import type { AnyEntity } from './entity'
import type { Select, Spawn, Update } from './world'

/**
 * A system is a function that updates the state of the game.
 */
export type System = {
	id: string
	run: (context: SystemContext) => void
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

export type SystemContext = Readonly<{
	spawn: Spawn
	select: Select
	getEntity: (id: string) => AnyEntity | undefined
	update: Update
}>

type SystemFn = (context: SystemContext) => void

type SystemArgs = {
	id: string
	type: SystemType
	onlyWhen?: (args: SystemContext) => boolean
	fn: SystemFn
}

function alwaysTrue() {
	return true
}

export function createSystem(args: SystemArgs): System {
	const { id, fn, type, onlyWhen = alwaysTrue } = args

	return {
		id,
		type,
		run(context: SystemContext) {
			const shouldRun = onlyWhen(context)

			if (!shouldRun) {
				return
			}

			fn(context)
		},
	}
}
