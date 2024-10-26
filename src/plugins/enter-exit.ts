import type { AnyEntity, Component, InferEntity } from '../ecs/entity'
import type { ScenePlugin } from '../engine/game'
import { createSystem, defineComponent, defineQuery, type Query, type System, type SystemContext, SystemType } from '../ecs'

const enterExitKey: unique symbol = Symbol('enter-exit:data')
type EnterExitKey = typeof enterExitKey
type EnterExitComponent = Component<EnterExitKey, unknown, unknown>
const enterExitEntity: EnterExitComponent = defineComponent<EnterExitKey, unknown>(enterExitKey)

export type EnterExitEntity = InferEntity<EnterExitComponent>

type EnterExitArgs<TEntity extends AnyEntity, TValue> = {
	enter: (context: SystemContext<TEntity>) => TValue
	exit?: (value: TValue) => void
}

function anyExit(value: unknown): void {
	if (typeof value === 'function') {
		value()
	}
}

function createEnterExit<TEntity extends EnterExitEntity, TValue>(args: EnterExitArgs<TEntity, TValue>): ScenePlugin {
	const { enter, exit = anyExit } = args

	const allEnterExits: Query<[typeof enterExitEntity]> = defineQuery({
		id: 'enter-exit',
		with: [enterExitEntity],
	})

	const enterSystem: System<TEntity> = createSystem({
		id: 'enter-exit:enter',
		type: SystemType.EnterScene,
		fn(context) {
			const { spawn } = context

			const value = enter(context)
			const entity = {
				[enterExitKey]: value,
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
				exit(value[enterExitKey] as TValue)
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

type EnterExitPlugin = {
	create: <TEntity extends EnterExitEntity, TValue>(args: EnterExitArgs<TEntity, TValue>) => ScenePlugin
	entity: EnterExitComponent
}

export const enterExit: EnterExitPlugin = {
	create: createEnterExit,
	entity: enterExitEntity,
}
