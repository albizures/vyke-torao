import type { Disposable } from './disposable'

export type AnyComponent = Component<ComponentInstance, any>

export type ComponentInstance = Disposable

export type Component<TInstance extends ComponentInstance, TArgs> = {
	label?: string
	create: (args: TArgs) => TInstance
	entryFrom: (args: TArgs) => [Component<TInstance, TArgs>, TInstance]
	is: (instance: unknown) => instance is TInstance
}

type ComponentArgs<TInstance extends ComponentInstance, TArgs> = {
	label?: string
	create: (args: TArgs) => TInstance
	is: (instance: unknown) => instance is TInstance
}

export function createComponent<
	TInstance extends ComponentInstance,
	TArgs,
>(args: ComponentArgs<TInstance, TArgs>): Component<TInstance, TArgs> {
	const { label, create, is } = args

	const component = {
		label, create, is,
		entryFrom(args: TArgs): [Component<TInstance, TArgs>, TInstance] {
			const instance = create(args)
			return [component, instance]
		},
	}

	return component
}

export type InferComponentInstance<TComponent> = TComponent extends Component<infer TInstance, any> ? TInstance : never
