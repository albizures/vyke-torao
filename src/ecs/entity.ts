import type { Simplify } from 'type-fest'

export type Entity = Record<any, any>

function identity<TValue>(value: TValue): TValue {
	return value
}

type Creator<TValue, TArgs> = (args: TArgs) => TValue

export type Component<TName extends string, TValue, TArgs> = {
	[K in TName]: Creator<TValue, TArgs>
}

export function defineComponent<TName extends string, TValue, TArgs = TValue>(
	name: TName,
	creator: Creator<TValue, TArgs> = identity as Creator<TValue, TArgs>,
): Component<TName, TValue, TArgs> {
	return {
		[name]: creator,
	} as Component<TName, TValue, TArgs>
}

export type InferEntity<TCreator> = Simplify<{
	[K in keyof TCreator]?: TCreator[K] extends Creator<infer TValue, any>
		? TValue
		: never
}>
