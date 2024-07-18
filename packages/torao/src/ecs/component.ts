import type { Disposable } from '../disposable'

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
}

export function createComponent<
	TInstance extends ComponentInstance,
	TArgs,
>(args: ComponentArgs<TInstance, TArgs>): Component<TInstance, TArgs> {
	const { label, create } = args
	const IS_INSTANCE = Symbol('isInstance')

	const component = {
		label,
		is(instance: unknown): instance is TInstance {
			return (instance as any ?? {})[IS_INSTANCE] === true
		},
		create(args: TArgs): TInstance {
			return {
				[IS_INSTANCE]: true,
				...create(args),
			}
		},
		entryFrom(args: TArgs): [Component<TInstance, TArgs>, TInstance] {
			return [
				component,
				{
					[IS_INSTANCE]: true,
					...create(args),
				},
			]
		},
	}

	return component
}

export type InferComponentInstance<TComponent> = TComponent extends Component<infer TInstance, any> ? TInstance : never
