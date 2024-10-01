import type { Entity } from '../ecs/entity'
import type { ScenePlugin } from '../game'
import { createSystem, defineQuery, type Query, type System, type SystemFnArgs, SystemType } from '../ecs'

type EnterExitArgs<TEntity extends Entity, TValue> = {
	component: keyof TEntity
	enter: (context: SystemFnArgs<TEntity>) => TValue
	exit: (value: TValue) => void
}

export function createEnterExit<TEntity extends Entity, TValue>(args: EnterExitArgs<TEntity, TValue>): ScenePlugin {
	const { enter, exit, component } = args

	const allEnterExits: Query<TEntity> = defineQuery({
		id: 'enter-exit',
		with: [component],
	})

	const enterSystem: System<TEntity> = createSystem({
		id: 'enter-exit:enter',
		type: SystemType.EnterScene,
		fn(context) {
			const { spawn } = context

			const value = enter(context)
			const entity = {
				[component]: value,
			} as TEntity

			spawn('enter-exit', entity)
		},
	})

	const exitSystem: System<TEntity> = createSystem({
		id: 'enter-exit:exit',
		type: SystemType.ExitScene,
		fn({ select }) {
			const value = select(allEnterExits).first()

			if (value) {
				exit(value[component])
			}
		},
	})

	return {
		id: 'enter-exit',
		queries(register) {
			register(allEnterExits)
		},
		systems: [enterSystem, exitSystem],
	}
}
