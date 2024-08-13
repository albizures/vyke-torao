import type { Entity } from './entity'
import type { AnyQuery } from './query'

export const COMPONENTS = Symbol('components')

export type AnyComponent = Component<ComponentInstance, any>

export type ComponentInstance = Record<string, any>

export type Component<TInstance extends ComponentInstance, TArgs> = {
	label?: string
	create: (args: TArgs) => TInstance
	entryFrom: (args: TArgs) => [Component<TInstance, TArgs>, TInstance]
	is: (instance: unknown) => instance is TInstance
	queries: Set<AnyQuery>
	removeFrom: (entity: Entity) => void
	getFrom: (entity: Entity) => TInstance | undefined
	addTo: (entity: Entity, args: TArgs) => void
}

type ComponentArgs<TInstance extends ComponentInstance, TArgs> = {
	label?: string
	create?: (args: TArgs) => TInstance
}

export function createComponent<
	TInstance extends ComponentInstance = Record<string, unknown>,
	TArgs = TInstance,
>(args: ComponentArgs<TInstance, TArgs>): Component<TInstance, TArgs> {
	const defaultCreate = (args: TArgs) => ({
		...args,
	}) as unknown as TInstance
	const { label, create = defaultCreate } = args
	const IS_INSTANCE = Symbol('isInstance')
	const queries = new Set<AnyQuery>()

	const component: Component<TInstance, TArgs> = {
		label,
		queries,
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
		removeFrom(entity: Entity) {
			entity[COMPONENTS].delete(component)
			for (const query of queries) {
				query.removeEntity(entity)
			}
		},
		addTo(entity: Entity, args: TArgs) {
			entity[COMPONENTS].set(component, component.create(args))
			for (const query of queries) {
				query.addEntity(entity)
			}
		},
		getFrom(entity: Entity): TInstance | undefined {
			return entity[COMPONENTS].get(component) as TInstance | undefined
		},
	}

	return component
}

type ComponentIdArgs = {
	label: string

}

export function createComponentTag(args: ComponentIdArgs) {
	const baseComponent = createComponent({
		label: args.label,
		create: () => ({
			tag: true,
		}),
	})
	return {
		...baseComponent,
		create() {
			return baseComponent.create({ tag: true })
		},
		entryFrom() {
			return baseComponent.entryFrom({ tag: true })
		},
		addTo(entity: Entity) {
			return baseComponent.addTo(entity, { tag: true })
		},
	}
}

export type InferComponentInstance<TComponent> = TComponent extends Component<infer TInstance, any> ? TInstance : never
