import type { Simplify } from 'type-fest'
import { type ComponentInstance, createComponent } from '../component'
import { disposableBox } from '../disposable'
import type { AnyTexture } from '../texture'

const IS_TEXTURE = Symbol('IS_TEXTURE')

type TextureCompo = Simplify<ComponentInstance & AnyTexture & {
	[IS_TEXTURE]: true
}>

type TextureArgs = AnyTexture

export const textureComp = createComponent({
	label: 'texture',
	create: (args: TextureArgs) => {
		const instance: TextureCompo = {
			...args,
			[IS_TEXTURE]: true,
		}

		return disposableBox.register(instance)
	},
	is: (instance): instance is TextureCompo => {
		return !!(instance as TextureCompo)[IS_TEXTURE]
	},
})
