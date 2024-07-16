import type { Disposable } from './disposable'

export type AnyComponent = Component<ComponentInstance, any>

export type ComponentInstance = Disposable

export type Component<TInstance extends ComponentInstance, TArgs> = {
	label?: string
	create: (args: TArgs) => TInstance
	is: (instance: unknown) => instance is TInstance
}

type ComponentArgs<TInstance, TArgs> = {
	label?: string
	create: (args: TArgs) => TInstance
	is: (instance: unknown) => instance is TInstance
}

export function createComponent<
	TInstance extends ComponentInstance,
	TArgs,
>(args: ComponentArgs<TInstance, TArgs>): Component<TInstance, TArgs> {
	const { label, create, is } = args
	return { label, create, is }
}

export type InferComponentInstance<TComponent> = TComponent extends Component<infer TInstance, any> ? TInstance : never
