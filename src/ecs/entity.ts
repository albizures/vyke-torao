import type { Simplify } from 'type-fest'
import type { Spawn } from './world'

export type Entity = Record<ComponentName, any>
export type ComponentName = string | number | symbol

function identity<TValue>(value: TValue): TValue {
	return value
}

type Creator<TValue, TArgs> = (args: TArgs) => TValue

export type Components = Record<ComponentName, Creator<any, any>>

export function build<
	TComponents extends Components,
	TArgs extends BuilderArgs<TComponents>,
>(components: TComponents, args: TArgs): ResultEntity<TComponents, keyof TArgs> {
	const entity = {} as Entity
	for (const key in components) {
		const component = components[key]!
		const value = args[key]

		if (value !== undefined) {
			entity[key] = component(value)
		}
	}

	return entity as ResultEntity<TComponents, keyof TArgs>
}

export type Component<TName extends ComponentName, TValue, TArgs> = {
	[K in TName]: Creator<TValue, TArgs>
}

export function spawn<TComponents extends Components>(
	id: string,
	components: TComponents,
	args: BuilderArgs<TComponents>,
	context: { spawn: Spawn<InferEntity<TComponents>> },
): InferEntity<TComponents> {
	const { spawn } = context
	return spawn(id, build(components, args))
}

export function defineComponent<TName extends ComponentName, TValue, TArgs = TValue>(
	name: TName,
	creator: Creator<TValue, TArgs> = identity as Creator<TValue, TArgs>,
): Component<TName, TValue, TArgs> {
	return {
		[name]: creator,
	} as Component<TName, TValue, TArgs>
}

export type InferEntity<TComponents> = Simplify<{
	[K in keyof TComponents]?: TComponents[K] extends Creator<infer TValue, any>
		? TValue
		: never
}>

type ResultEntity<
	TComponents extends Components,
	TRequired extends keyof TComponents,
> = Simplify<Required<Pick<InferEntity<TComponents>, TRequired>>>

export type BuilderArgs<Components> = {
	[K in keyof Components]?: Components[K] extends Creator<any, infer TArgs>
		? TArgs
		: never
}
