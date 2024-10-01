import type { Simplify } from 'type-fest'

export type Entity = Record<Name, any>
export type Name = string | number | symbol

type Component<TName extends Name, TValue, TArgs> = {
	name: TName
	creator: (args: TArgs) => TValue
}
function identity<TValue>(value: TValue): TValue {
	return value
}

type Creator<TValue, TArgs> = (args: TArgs) => TValue

export function defineComponent<TName extends Name, TValue, TArgs = TValue>(
	name: TName,
	creator: Creator<TValue, TArgs> = identity as Creator<TValue, TArgs>,
): Component<TName, TValue, TArgs> {
	return {
		name,
		creator,
	}
}

export type InferEntityWith<TComponent extends Component<Name, any, any>> = {
	[K in TComponent['name']]: ReturnType<TComponent['creator']>
}

export type EntityBuilder<TComponents extends BuilderComponents> = {
	build: <TArgs extends BuilderArgs<TComponents>>(args: TArgs) => ResultEntity<TComponents, keyof TArgs>
	components: TComponents
}

export type BuilderComponents = Record<Name, Component<Name, any, any>>

type EntityDefiner<TComponents extends BuilderComponents> = {
	add: <TName extends Name, TValue, TArgs>(component: Component<TName, TValue, TArgs>) =>
	EntityDefiner<Simplify<TComponents & { [name in TName]: Component<TName, TValue, TArgs> }>>
	get: () => EntityBuilder<TComponents>
}

function entityDefiner<TComponents extends BuilderComponents>(components: TComponents): EntityDefiner<TComponents> {
	return {
		add: <TName extends Name, TValue, TArgs>(component: Component<TName, TValue, TArgs>) => {
			const newComponents = components as TComponents & {
				[name in TName]: Component<TName, TValue, TArgs>
			}
			// @ts-expect-error they are not compatible
			newComponents[component.name] = component

			return entityDefiner(newComponents)
		},
		get: () => {
			const builder: EntityBuilder<TComponents> = {
				components,
				build: (args) => build(components, args),
			}
			return builder
		},
	}
}

// eslint-disable-next-line ts/no-empty-object-type
type NoComponents = {}

export function defineEntity(): EntityDefiner<NoComponents> {
	return entityDefiner({ })
}

export type BuilderArgs<Components> = {
	[K in keyof Components]?: Components[K] extends Component<infer _TName, infer _TValue, infer TArgs>
		? TArgs
		: never
}

type ResultEntity<
	TComponents extends BuilderComponents,
	TRequired extends keyof TComponents,
> = Simplify<Required<Pick<InferFromComponents<TComponents>, TRequired>>>

export function build<
	TComponents extends BuilderComponents,
	TArgs extends BuilderArgs<TComponents>,
>(components: TComponents, args: TArgs): ResultEntity<TComponents, keyof TArgs> {
	const entity = {} as Entity
	for (const key in components) {
		const component = components[key]!
		const value = args[key]

		if (value !== undefined) {
			entity[key] = component.creator(value)
		}
	}

	return entity as ResultEntity<TComponents, keyof TArgs>
}

export type InferFromComponents<TComponents> = Simplify<{
	[K in keyof TComponents]?: TComponents[K] extends Component<infer _TName, infer TValue, infer _TArgs>
		? TValue
		: never
}>
export type InferEntity<TBuilder extends { components: unknown }> = InferFromComponents<TBuilder['components']>
