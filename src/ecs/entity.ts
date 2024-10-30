import type { Merge, Simplify } from 'type-fest'
import { map, set } from '../types'

export type ComponentId = string | number | symbol

export type AnyEntity = Record<ComponentId, any>

function identity<TValue>(value: TValue): TValue {
	return value
}

export type AnyEntityCreator = Record<string, Creator<any, any>>

export type Creator<TValue, TArgs> = (args: TArgs) => TValue

export type Component<TName extends ComponentId, TValue, TArgs> = {
	[K in TName]: Creator<TValue, TArgs>
}

export type AnyComponent = Component<ComponentId, any, any>

const allComponents = set<ComponentId>()
const components = map<AnyComponent, ComponentId>()

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
export function defineComponent<TName extends ComponentId, TValue, TArgs = TValue>(
	name: TName,
	creator: Creator<TValue, TArgs> = identity as Creator<TValue, TArgs>,
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

export function getComponentId(component: AnyComponent): ComponentId | undefined {
	return components.get(component)
}

export function hasComponent(entity: AnyEntity, component: AnyComponent): boolean {
	const name = components.get(component)!

	return name in entity
}

export type InferEntity<TCreator> = Simplify<{
	[K in keyof TCreator]?: TCreator[K] extends Creator<infer TValue, any>
		? TValue
		: never
}>

export type InferWithComponent<TComponent> = TComponent extends Component<infer TName, infer TValue, any>
	? { [K in TName]: TValue }
	: never

export type InferWithComponents<TComponents> = TComponents extends [infer TComponent, ...infer TRest]
	? Merge<InferWithComponent<TComponent>, InferWithComponents<TRest>>
	// eslint-disable-next-line ts/no-empty-object-type
	: {}
