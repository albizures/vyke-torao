import { type ComponentInstance, createComponent } from '../component'
import { disposableBox } from '../disposable'

const isVelocity = Symbol('isVelocity')

type VelocityComp = ComponentInstance & {
	x: number
	y: number
	[isVelocity]: true
}

type VelocityArgs = {
	x: number
	y: number
}

export const velocityComp = createComponent({
	label: 'velocity',
	create: (args: VelocityArgs): VelocityComp => {
		const instance: VelocityComp = {
			...args,
			[isVelocity]: true,
		}

		disposableBox.register(instance)
		return instance
	},
	is: (instance): instance is VelocityComp => {
		return !!(instance as VelocityComp)[isVelocity]
	},
})
