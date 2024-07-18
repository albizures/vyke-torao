import { type ComponentInstance, createComponent } from '../component'
import { disposableBox } from '../disposable'

type VelocityComp = ComponentInstance & {
	x: number
	y: number
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
		}

		disposableBox.register(instance)
		return instance
	},
})
