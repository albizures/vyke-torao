import type { Merge, Simplify } from 'type-fest'
import type { Maybe } from './query'
import { assert } from '../error'
import { map, set } from '../types'

export type ComponentKey = string | number | symbol

export type AnyEntity = Record<ComponentKey, any>

function identityFn<TValue>(value: TValue): TValue {
	return value
}

export function identity<TValue>() {
	return identityFn as Creator<TValue, TValue>
}

export type AnyEntityCreator = Record<string, Creator<any, any>>

type Creator<TValue, TArgs> = (args: TArgs) => TValue

export type Component<TName extends ComponentKey, TValue, TArgs> = Record<TName, Creator<TValue, TArgs>>

export type AnyComponent = Component<ComponentKey, any, any>

const allComponents = set<ComponentKey>()
const components = map<AnyComponent, ComponentKey>()

/**
 * Define a new component.
 * @example
 * ```ts
 * const Size = defineComponent('size', (value: number) => value)
 * const Position = defineComponent('position', (pos: {x?: number, y?: number}) => {
 * 	return {x: pos.x ?? 0, y: pos.y ?? 0}
 * })
 * ```
 */
export function defineComponent<TName extends ComponentKey, TValue, TArgs = TValue>(
	name: TName,
	creator: Creator<TValue, TArgs>,
): Component<TName, TValue, TArgs> {
	if (allComponents.has(name)) {
		throw new Error(`Component ${String(name)} already exists`)
	}

	const component = {
		[name]: creator,
	} as Component<TName, TValue, TArgs>
	components.set(
		component,
		name,
	)
	return component
}

export function getComponentId(component: AnyComponent): ComponentKey {
	const id = components.get(component)
	assert(id, `Component ${component} not found`)

	return id
}

export function hasComponent(entity: AnyEntity, component: AnyComponent): boolean {
	const name = components.get(component)!

	return name in entity
}

export function isMaybeComponent(component: unknown): component is Maybe<AnyComponent> {
	return Boolean(typeof component === 'object' && component && 'component' in component)
}

export type InferEntity<TCreator> = Simplify<{
	[K in keyof TCreator]?: TCreator[K] extends Creator<infer TValue, any>
		? TValue
		: never
}>

export type InferWithComponent<TComponent extends AnyComponent> = TComponent extends Component<infer TName, infer TValue, any>
	? { [K in TName]: TValue }
	: never

export type InferWith<TComponent> = TComponent extends AnyComponent
	? InferWithComponent<TComponent>
	: TComponent extends Maybe<infer TComponent>
		? Partial<InferWith<TComponent>>
		: never

export type InferWithComponents<TComponents> = TComponents extends [infer TComponent, ...infer TRest]
	? Merge<InferWith<TComponent>, InferWithComponents<TRest>>
	// eslint-disable-next-line ts/no-empty-object-type
	: {}
