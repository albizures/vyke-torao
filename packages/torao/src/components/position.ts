import type { Simplify } from 'type-fest'
import { type ComponentInstance, createComponent } from '../component'
import { disposableBox } from '../disposable'
import type { Vec2d } from '../vec'

const isPosition = Symbol('isPosition')

type PositionComp = Simplify<ComponentInstance & Vec2d & {
	[isPosition]: true
}>

type PositionArgs = Vec2d

export const positionComp = createComponent({
	label: 'position',
	create: (args: PositionArgs) => {
		const instance: PositionComp = {
			...args,
			[isPosition]: true,
		}
		disposableBox.register(instance)
		return instance
	},
	is: (instance): instance is PositionComp => {
		return !!(instance as PositionComp)[isPosition]
	},
})
