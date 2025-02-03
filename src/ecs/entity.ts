import type { Merge, Simplify } from 'type-fest'
import { assert } from '../error'
import { set } from '../types'
import { Maybe } from './query'

export type ComponentKey = string | number | symbol

export type AnyEntity = Partial<Record<ComponentKey, any>>

export function identity<TValue>() {
	function identityFn<TValue>(value: TValue): TValue {
		return value
	}

	return identityFn as CreatorFn<TValue, TValue>
}

type CreatorFn<TValue, TArgs> = (args: TArgs) => TValue
type Creator<TName, TValue, TArgs> = {
	(args: TArgs): TValue
	componentName: TName
}
export type AnyCreator = Creator<any, any, any>

export type Component<TName extends ComponentKey, TValue, TArgs> = Record<TName, Creator<TName, TValue, TArgs>>

export function hasComponent(entity: AnyEntity, creator: AnyCreator): boolean {
	return creator.componentName in entity
}

export function isMaybe(component: unknown): component is Maybe<AnyCreator> {
	return component instanceof Maybe
}

export type InferEntity<TCreator> = Simplify<{
	[K in keyof TCreator]?: TCreator[K] extends Creator<any, infer TValue, any>
		? TValue
		: never
}>

type InferWithComponent<TCreator extends AnyCreator> = TCreator extends Creator<infer TName, infer TValue, any>
	? TName extends ComponentKey
		? Record<TName, TValue>
		: never
	: never

export type InferWith<TCreator> = TCreator extends AnyCreator
	? InferWithComponent<TCreator>
	: TCreator extends Maybe<infer TCreator>
		? Partial<InferWith<TCreator>>
		: never

export type InferWithComponents<TCreators> = TCreators extends [infer TCreator, ...infer TRest]
	? Merge<InferWith<TCreator>, InferWithComponents<TRest>>
	// eslint-disable-next-line ts/no-empty-object-type
	: {}

type EntityDefinition = {
	[key: string]: CreatorFn<any, any>
}

export type InferEntityDefinition<TDefinition extends EntityDefinition> = Simplify<{
	[TKey in keyof TDefinition]: TDefinition[TKey] extends Creator<any, infer TValue, infer TArgs>
		? Creator<TKey, TValue, TArgs>
		: TDefinition[TKey] extends CreatorFn<infer TValue, infer TArgs>
			? Creator<TKey, TValue, TArgs>
			: never
}>
/**
 * Define an entity with components.
 */
export function defineEntity<TDefinition extends EntityDefinition>(definition: TDefinition): InferEntityDefinition<TDefinition> {
	const components = set<ComponentKey>()

	for (const key in definition) {
		assert(!components.has(key), `Component ${key} is already defined`)

		if (definition[key]) {
			const creator = definition[key] as AnyCreator
			creator.componentName = key
			components.add(key)
		}
	}

	return definition as unknown as InferEntityDefinition<TDefinition>
}
