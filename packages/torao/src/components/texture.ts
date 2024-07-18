import type { Simplify } from 'type-fest'
import { disposableBox } from '../disposable'
import type { AnyTexture } from '../texture'
import { type ComponentInstance, createComponent } from '../ecs'

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
