import type { System, SystemContext } from '../ecs'
import type { Component, InferEntity } from '../ecs/entity'
import type { GamePlugin, ScenePlugin } from '../engine'
import { createSystem, defineComponent, defineQuery, SystemType } from '../ecs'

const enterExitKey: unique symbol = Symbol('enter-exit:data')
type EnterExitKey = typeof enterExitKey
type EnterExitComponent = Component<EnterExitKey, unknown, unknown>
export const EnterExitEntity: EnterExitComponent = defineComponent<EnterExitKey, unknown>(enterExitKey)

export type EnterExitEntity = InferEntity<EnterExitComponent>

type EnterExitArgs<TValue> = {
	enter: (context: SystemContext) => TValue
	exit?: (value: TValue) => void
}

function anyExit(value: unknown): void {
	if (typeof value === 'function') {
		value()
	}
}

function createPluginScene<TEntity extends EnterExitEntity, TValue>(args: EnterExitArgs<TValue>): ScenePlugin {
	const { enter, exit = anyExit } = args

	const allEnterExits = defineQuery({
		id: 'enter-exit',
		with: [EnterExitEntity],
	})

	const enterSystem: System = createSystem({
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

	const exitSystem: System = createSystem({
		id: 'enter-exit:exit',
		type: SystemType.BeforeExitScene,
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

export function createEnterExit<TValue>(args: EnterExitArgs<TValue>): { scene: ScenePlugin } {
	return {
		scene: createPluginScene(args),
	} as const satisfies GamePlugin
}
