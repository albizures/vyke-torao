import type { AnyEntity, AnyEntityCreator, Component, InferEntity } from '../ecs/entity'
import type { GamePlugin, ScenePlugin } from '../engine'
import { createSystem, defineComponent, defineQuery, type System, type SystemContext, SystemType } from '../ecs'

const enterExitKey: unique symbol = Symbol('enter-exit:data')
type EnterExitKey = typeof enterExitKey
type EnterExitComponent = Component<EnterExitKey, unknown, unknown>
export const EnterExitEntity: EnterExitComponent = defineComponent<EnterExitKey, unknown>(enterExitKey)

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

function createPluginScene<TEntity extends EnterExitEntity, TValue>(args: EnterExitArgs<TEntity, TValue>): ScenePlugin {
	const { enter, exit = anyExit } = args

	const allEnterExits = defineQuery({
		id: 'enter-exit',
		with: [EnterExitEntity],
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

type CreateEnterExitArgs<TCreator extends AnyEntityCreator, TValue> = EnterExitArgs<InferEntity<TCreator>, TValue> & {
	entity: TCreator
}

export function createEnterExit<TCreator extends AnyEntityCreator, TValue>(args: CreateEnterExitArgs<TCreator, TValue>): { scene: ScenePlugin } {
	return {
		scene: createPluginScene(args),
	} as const satisfies GamePlugin
}
