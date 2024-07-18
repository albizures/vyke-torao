import type { Simplify } from 'type-fest'
import { type ComponentInstance, createComponent } from '../component'
import { disposableBox } from '../disposable'
import type { AnyTexture } from '../texture'

type TextureCompo = Simplify<ComponentInstance & AnyTexture>

type TextureArgs = AnyTexture

export const textureComp = createComponent({
	label: 'texture',
	create: (args: TextureArgs) => {
		const instance: TextureCompo = {
			...args,
		}

		return disposableBox.register(instance)
	},
})
