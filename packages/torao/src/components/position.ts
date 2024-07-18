import type { Simplify } from 'type-fest'
import { type ComponentInstance, createComponent } from '../ecs'
import { disposableBox } from '../disposable'
import type { Vec2d } from '../vec'

type PositionComp = Simplify<ComponentInstance & Vec2d>

type PositionArgs = Vec2d

export const positionComp = createComponent({
	label: 'position',
	create: (args: PositionArgs) => {
		const instance: PositionComp = args
		disposableBox.register(instance)
		return instance
	},
})
